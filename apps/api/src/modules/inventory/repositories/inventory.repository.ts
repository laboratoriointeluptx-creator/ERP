import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { addDecimal, isGreaterThan, subtractDecimal } from '../../../shared/decimal.js';
import { InventoryModel } from '../models/inventory.model.js';
import { InventoryMovementModel } from '../models/inventory-movement.model.js';
import { WarehouseModel } from '../../warehouses/models/warehouse.model.js';
import { ProductModel } from '../../products/models/product.model.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import type { InventoryMovementQuery, InventoryQuery, MovementInput } from '../validators/inventory.schemas.js';

const isOutbound = (input: MovementInput): boolean => input.type === 'DAMAGE' || (input.type === 'ADJUSTMENT' && input.direction === 'DECREASE');

export const listInventoryBalances = async (organizationId: string, query: InventoryQuery) => {
  const filter = {
    organizationId,
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(query.productId ? { productId: query.productId } : {}),
  };
  const [items, total] = await Promise.all([
    InventoryModel.find(filter).sort({ updatedAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    InventoryModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const listInventoryMovements = async (organizationId: string, query: InventoryMovementQuery) => {
  const filter = {
    organizationId,
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.type ? { type: query.type } : {}),
  };
  const [items, total] = await Promise.all([
    InventoryMovementModel.find(filter).sort({ occurredAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    InventoryMovementModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const applyInventoryMovement = async (
  organizationId: string,
  userId: string,
  input: MovementInput,
  ip?: string,
): Promise<unknown> => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const [warehouse, product] = await Promise.all([
        WarehouseModel.findOne({ _id: input.warehouseId, organizationId, active: true }).session(session).exec(),
        ProductModel.findOne({ _id: input.productId, organizationId, active: true }).session(session).exec(),
      ]);
      if (!warehouse || !product) {
        throw new HttpError(404, 'INVENTORY_REFERENCE_NOT_FOUND', 'Warehouse or product not found');
      }

      const balance = await InventoryModel.findOne({ organizationId, warehouseId: warehouse._id, productId: product._id }).session(session).exec();
      const currentQuantity = balance?.quantity ?? '0';
      const reservedQuantity = balance?.reservedQuantity ?? '0';
      if (isGreaterThan(reservedQuantity, currentQuantity)) {
        throw new HttpError(409, 'INVENTORY_BALANCE_INVALID', 'Reserved stock exceeds on-hand stock');
      }
      const availableQuantity = subtractDecimal(currentQuantity, reservedQuantity);
      if (isOutbound(input) && isGreaterThan(input.quantity, availableQuantity)) {
        throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock');
      }
      const nextQuantity = isOutbound(input)
        ? subtractDecimal(currentQuantity, input.quantity)
        : addDecimal(currentQuantity, input.quantity);
      const updatedBalance = await InventoryModel.findOneAndUpdate(
        { organizationId, warehouseId: warehouse._id, productId: product._id },
        { $set: { quantity: nextQuantity }, $setOnInsert: { reservedQuantity: '0' } },
        { upsert: true, new: true, runValidators: true, session },
      ).exec();
      const [movement] = await InventoryMovementModel.create([{
        organizationId,
        warehouseId: warehouse._id,
        productId: product._id,
        type: input.type,
        ...(input.direction ? { direction: input.direction } : {}),
        quantity: input.quantity,
        reason: input.reason,
        ...(input.referenceType ? { referenceType: input.referenceType } : {}),
        ...(input.referenceId ? { referenceId: input.referenceId } : {}),
      }], { session });
      if (!movement) throw new Error('Inventory movement creation returned no document');
      await recordAuditEvent({
        organizationId,
        userId,
        action: 'inventory.movement.applied',
        module: 'inventory',
        entity: 'InventoryMovement',
        entityId: String(movement._id),
        ...(ip ? { ip } : {}),
        before: { quantity: currentQuantity, reservedQuantity },
        after: {
          type: input.type,
          ...(input.direction ? { direction: input.direction } : {}),
          quantity: input.quantity,
          reason: input.reason,
          quantityOnHand: nextQuantity,
          reservedQuantity,
          warehouseId: String(warehouse._id),
          productId: String(product._id),
        },
      }, session);
      result = updatedBalance;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
