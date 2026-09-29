import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { isGreaterThan, subtractDecimal, addDecimal } from '../../../shared/decimal.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { ProductModel } from '../../products/models/product.model.js';
import { WarehouseModel } from '../../warehouses/models/warehouse.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import { InventoryMovementModel } from '../models/inventory-movement.model.js';
import { InventoryTransferModel } from '../models/inventory-transfer.model.js';
import type { InventoryTransferInput, InventoryTransferQuery } from '../validators/inventory.schemas.js';

export const listInventoryTransfers = async (organizationId: string, query: InventoryTransferQuery) => {
  const filter = {
    organizationId,
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.warehouseId ? { $or: [{ sourceWarehouseId: query.warehouseId }, { destinationWarehouseId: query.warehouseId }] } : {}),
  };
  const [items, total] = await Promise.all([
    InventoryTransferModel.find(filter).sort({ occurredAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    InventoryTransferModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const transferInventory = async (
  organizationId: string,
  userId: string,
  input: InventoryTransferInput,
  ip?: string,
) => {
  if (input.sourceWarehouseId.toLowerCase() === input.destinationWarehouseId.toLowerCase()) {
    throw new HttpError(409, 'TRANSFER_SAME_WAREHOUSE', 'Source and destination warehouses must be different');
  }

  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const [sourceWarehouse, destinationWarehouse, product] = await Promise.all([
        WarehouseModel.findOne({ _id: input.sourceWarehouseId, organizationId, active: true }).session(session).exec(),
        WarehouseModel.findOne({ _id: input.destinationWarehouseId, organizationId, active: true }).session(session).exec(),
        ProductModel.findOne({ _id: input.productId, organizationId, active: true }).session(session).exec(),
      ]);
      if (!sourceWarehouse || !destinationWarehouse || !product) {
        throw new HttpError(404, 'TRANSFER_REFERENCE_NOT_FOUND', 'Source warehouse, destination warehouse, or product not found');
      }

      const sourceBalance = await InventoryModel.findOne({ organizationId, warehouseId: sourceWarehouse._id, productId: product._id }).session(session).exec();
      if (!sourceBalance) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Source warehouse has no stock for this product');
      if (isGreaterThan(sourceBalance.reservedQuantity, sourceBalance.quantity)) {
        throw new HttpError(409, 'INVENTORY_BALANCE_INVALID', 'Reserved stock exceeds on-hand stock');
      }
      const available = subtractDecimal(sourceBalance.quantity, sourceBalance.reservedQuantity);
      if (isGreaterThan(input.quantity, available)) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Transfer quantity exceeds available stock');

      const sourceNext = subtractDecimal(sourceBalance.quantity, input.quantity);
      const sourceUpdate = await InventoryModel.updateOne(
        { _id: sourceBalance._id, organizationId, quantity: sourceBalance.quantity, reservedQuantity: sourceBalance.reservedQuantity },
        { $set: { quantity: sourceNext } },
        { session, runValidators: true },
      ).exec();
      if (sourceUpdate.matchedCount !== 1) throw new HttpError(409, 'INVENTORY_BALANCE_CHANGED', 'Source balance changed; reload and try the transfer again');

      const destinationBalance = await InventoryModel.findOne({ organizationId, warehouseId: destinationWarehouse._id, productId: product._id }).session(session).exec();
      const destinationCurrent = destinationBalance?.quantity ?? '0';
      const destinationReserved = destinationBalance?.reservedQuantity ?? '0';
      if (isGreaterThan(destinationReserved, destinationCurrent)) throw new HttpError(409, 'INVENTORY_BALANCE_INVALID', 'Destination reserved stock exceeds on-hand stock');
      const destinationNext = addDecimal(destinationCurrent, input.quantity);
      await InventoryModel.findOneAndUpdate(
        { organizationId, warehouseId: destinationWarehouse._id, productId: product._id },
        { $set: { quantity: destinationNext }, $setOnInsert: { reservedQuantity: '0' } },
        { upsert: true, new: true, runValidators: true, session },
      ).exec();

      const transfer = await InventoryTransferModel.create([{
        organizationId,
        sourceWarehouseId: sourceWarehouse._id,
        destinationWarehouseId: destinationWarehouse._id,
        productId: product._id,
        quantity: input.quantity,
        reason: input.reason,
        createdBy: userId,
      }], { session }).then(([created]) => created);
      if (!transfer) throw new Error('Inventory transfer creation returned no document');

      await InventoryMovementModel.create([
        { organizationId, warehouseId: sourceWarehouse._id, productId: product._id, type: 'TRANSFER', direction: 'DECREASE', quantity: input.quantity, reason: input.reason, referenceType: 'INVENTORY_TRANSFER', referenceId: String(transfer._id) },
        { organizationId, warehouseId: destinationWarehouse._id, productId: product._id, type: 'TRANSFER', direction: 'INCREASE', quantity: input.quantity, reason: input.reason, referenceType: 'INVENTORY_TRANSFER', referenceId: String(transfer._id) },
      ], { session });

      await recordAuditEvent({
        organizationId,
        userId,
        action: 'inventory.transferred',
        module: 'inventory',
        entity: 'InventoryTransfer',
        entityId: String(transfer._id),
        ...(ip ? { ip } : {}),
        before: { sourceQuantity: sourceBalance.quantity, sourceReserved: sourceBalance.reservedQuantity, destinationQuantity: destinationCurrent, destinationReserved },
        after: { quantity: input.quantity, reason: input.reason, sourceQuantity: sourceNext, sourceReserved: sourceBalance.reservedQuantity, destinationQuantity: destinationNext, destinationReserved, sourceWarehouseId: String(sourceWarehouse._id), destinationWarehouseId: String(destinationWarehouse._id), productId: String(product._id) },
      }, session);
      result = transfer;
    });
    if (!result) throw new Error('Inventory transfer transaction returned no result');
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'INVENTORY_BALANCE_CHANGED', 'Inventory changed concurrently; reload and try the transfer again');
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
