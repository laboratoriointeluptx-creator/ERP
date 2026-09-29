import mongoose from 'mongoose';
import { addDecimal, isGreaterThan, subtractDecimal } from '../../../shared/decimal.js';
import { HttpError } from '../../../shared/http.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { ShipmentModel } from '../../logistics/models/shipment.model.js';
import { PurchaseOrderModel } from '../../purchases/models/purchase-order.model.js';
import { SalesOrderModel } from '../../sales/models/sales-order.model.js';
import { WarehouseModel } from '../../warehouses/models/warehouse.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import { InventoryMovementModel } from '../models/inventory-movement.model.js';
import { InventoryReturnModel } from '../models/inventory-return.model.js';
import type { CreatePurchaseReturnInput, CreateSalesReturnInput, InventoryReturnQuery } from '../validators/inventory.schemas.js';

export const listInventoryReturns = async (organizationId: string, query: InventoryReturnQuery) => {
  const filter = {
    organizationId,
    ...(query.sourceType ? { sourceType: query.sourceType } : {}),
    ...(query.productId ? { 'lines.productId': query.productId } : {}),
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
  };
  const [items, total] = await Promise.all([
    InventoryReturnModel.find(filter).sort({ occurredAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    InventoryReturnModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

const aggregateLines = (lines: readonly { productId: unknown; quantity: string }[]) => {
  const quantities = new Map<string, string>();
  for (const line of lines) {
    const productId = String(line.productId).toLowerCase();
    quantities.set(productId, addDecimal(quantities.get(productId) ?? '0', line.quantity));
  }
  return quantities;
};

const getProductReturnTotals = (documents: readonly { lines: readonly { productId: unknown; quantity: string }[] }[]) => {
  const totals = new Map<string, string>();
  for (const document of documents) {
    for (const line of document.lines) {
      const productId = String(line.productId).toLowerCase();
      totals.set(productId, addDecimal(totals.get(productId) ?? '0', line.quantity));
    }
  }
  return totals;
};

export const createSalesReturn = async (organizationId: string, userId: string, input: CreateSalesReturnInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const order = await SalesOrderModel.findOne({ _id: input.salesOrderId, organizationId }).session(session).exec();
      if (!order) throw new HttpError(404, 'SALES_ORDER_NOT_FOUND', 'Sales order not found');
      if (order.status !== 'SHIPPED' && order.status !== 'COMPLETED') throw new HttpError(409, 'SALES_ORDER_NOT_RETURNABLE', 'Only shipped or completed sales orders can be returned');
      if (!order.warehouseId) throw new HttpError(409, 'SALES_ORDER_WAREHOUSE_MISSING', 'Sales order has no source warehouse');
      const shipment = await ShipmentModel.findOne({ organizationId, salesOrderId: order._id, status: { $in: ['SHIPPED', 'IN_TRANSIT', 'DELIVERED'] } }).session(session).exec();
      if (!shipment) throw new HttpError(409, 'SALES_ORDER_NOT_SHIPPED', 'Sales order has no dispatched shipment');
      const warehouse = await WarehouseModel.findOne({ _id: order.warehouseId, organizationId, active: true }).session(session).exec();
      if (!warehouse) throw new HttpError(404, 'WAREHOUSE_NOT_FOUND', 'Original sales warehouse not found');

      const sold = aggregateLines(order.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })));
      const previousReturns = await InventoryReturnModel.find({ organizationId, sourceType: 'SALE_ORDER', sourceDocumentId: order._id }).session(session).exec();
      const returned = getProductReturnTotals(previousReturns);
      const requested = aggregateLines(input.lines);
      for (const [productId, quantity] of requested) {
        const soldQuantity = sold.get(productId);
        if (!soldQuantity) throw new HttpError(400, 'PRODUCT_NOT_IN_SALES_ORDER', 'Return contains a product not present in the sales order');
        const previouslyReturned = returned.get(productId) ?? '0';
        const remaining = isGreaterThan(previouslyReturned, soldQuantity) ? '0' : subtractDecimal(soldQuantity, previouslyReturned);
        if (isGreaterThan(quantity, remaining)) throw new HttpError(409, 'SALES_RETURN_QUANTITY_EXCEEDED', 'Returned quantity exceeds the shipped quantity remaining for this product');
      }

      const returnRecord = await InventoryReturnModel.create([{
        organizationId, sourceType: 'SALE_ORDER', sourceDocumentId: order._id, warehouseId: warehouse._id,
        reason: input.reason, createdBy: userId, lines: input.lines,
      }], { session }).then(([created]) => created);
      if (!returnRecord) throw new Error('Sales return creation returned no document');

      for (const [productId, quantity] of requested) {
        const balance = await InventoryModel.findOne({ organizationId, warehouseId: warehouse._id, productId }).session(session).exec();
        const current = balance?.quantity ?? '0';
        const next = addDecimal(current, quantity);
        await InventoryModel.findOneAndUpdate(
          { organizationId, warehouseId: warehouse._id, productId },
          { $set: { quantity: next }, $setOnInsert: { reservedQuantity: '0' } },
          { upsert: true, new: true, runValidators: true, session },
        ).exec();
        await InventoryMovementModel.create([{
          organizationId, warehouseId: warehouse._id, productId, type: 'RETURN', direction: 'INCREASE', quantity,
          reason: input.reason, referenceType: 'SALES_RETURN', referenceId: String(returnRecord._id),
        }], { session });
      }
      await recordAuditEvent({ organizationId, userId, action: 'inventory.sales_return.created', module: 'inventory', entity: 'InventoryReturn', entityId: String(returnRecord._id), ...(ip ? { ip } : {}), after: { sourceType: returnRecord.sourceType, salesOrderId: String(order._id), warehouseId: String(warehouse._id), reason: input.reason, lines: [...requested].map(([productId, quantity]) => ({ productId, quantity })) } }, session);
      result = returnRecord;
    });
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) throw new HttpError(409, 'SALES_RETURN_CONFLICT', 'Inventory changed concurrently; reload and try the sales return again');
    throw error;
  } finally { await session.endSession(); }
};

export const createPurchaseReturn = async (organizationId: string, userId: string, input: CreatePurchaseReturnInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const order = await PurchaseOrderModel.findOne({ _id: input.purchaseOrderId, organizationId }).session(session).exec();
      if (!order) throw new HttpError(404, 'PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found');
      if (order.status !== 'PARTIALLY_RECEIVED' && order.status !== 'RECEIVED') throw new HttpError(409, 'PURCHASE_ORDER_NOT_RETURNABLE', 'Only partially or fully received purchase orders can be returned');
      const warehouse = await WarehouseModel.findOne({ _id: input.warehouseId, organizationId, active: true }).session(session).exec();
      if (!warehouse) throw new HttpError(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');

      const requested = aggregateLines(input.lines);
      const previousReturns = await InventoryReturnModel.find({ organizationId, sourceType: 'PURCHASE_ORDER', sourceDocumentId: order._id, warehouseId: warehouse._id }).session(session).exec();
      const returned = getProductReturnTotals(previousReturns);
      for (const [productId, quantity] of requested) {
        const orderLine = order.lines.find((line) => String(line.productId).toLowerCase() === productId);
        if (!orderLine) throw new HttpError(400, 'PRODUCT_NOT_IN_PURCHASE_ORDER', 'Return contains a product not present in the purchase order');
        const receivedMovements = await InventoryMovementModel.find({ organizationId, warehouseId: warehouse._id, productId, type: 'PURCHASE', referenceType: 'PURCHASE_ORDER', referenceId: String(order._id) }).session(session).exec();
        const receivedQuantity = receivedMovements.reduce((total, movement) => addDecimal(total, movement.quantity), '0');
        const previouslyReturned = returned.get(productId) ?? '0';
        const remaining = isGreaterThan(previouslyReturned, receivedQuantity) ? '0' : subtractDecimal(receivedQuantity, previouslyReturned);
        if (isGreaterThan(quantity, remaining)) throw new HttpError(409, 'PURCHASE_RETURN_QUANTITY_EXCEEDED', 'Returned quantity exceeds the quantity received in this warehouse and remaining on the order');
        const balance = await InventoryModel.findOne({ organizationId, warehouseId: warehouse._id, productId }).session(session).exec();
        if (!balance) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Warehouse has no stock for the returned product');
        if (isGreaterThan(balance.reservedQuantity, balance.quantity)) throw new HttpError(409, 'INVENTORY_BALANCE_INVALID', 'Reserved stock exceeds on-hand stock');
        const available = subtractDecimal(balance.quantity, balance.reservedQuantity);
        if (isGreaterThan(quantity, available)) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Purchase return quantity exceeds available unreserved stock');
      }

      const returnRecord = await InventoryReturnModel.create([{
        organizationId, sourceType: 'PURCHASE_ORDER', sourceDocumentId: order._id, warehouseId: warehouse._id,
        reason: input.reason, createdBy: userId, lines: input.lines,
      }], { session }).then(([created]) => created);
      if (!returnRecord) throw new Error('Purchase return creation returned no document');

      for (const [productId, quantity] of requested) {
        const balance = await InventoryModel.findOne({ organizationId, warehouseId: warehouse._id, productId }).session(session).exec();
        if (!balance) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Warehouse has no stock for the returned product');
        const next = subtractDecimal(balance.quantity, quantity);
        const update = await InventoryModel.updateOne(
          { _id: balance._id, organizationId, quantity: balance.quantity, reservedQuantity: balance.reservedQuantity },
          { $set: { quantity: next } },
          { session, runValidators: true },
        ).exec();
        if (update.matchedCount !== 1) throw new HttpError(409, 'INVENTORY_BALANCE_CHANGED', 'Inventory changed; reload and try the return again');
        await InventoryMovementModel.create([{
          organizationId, warehouseId: warehouse._id, productId, type: 'RETURN', direction: 'DECREASE', quantity,
          reason: input.reason, referenceType: 'PURCHASE_RETURN', referenceId: String(returnRecord._id),
        }], { session });
      }
      await recordAuditEvent({ organizationId, userId, action: 'inventory.purchase_return.created', module: 'inventory', entity: 'InventoryReturn', entityId: String(returnRecord._id), ...(ip ? { ip } : {}), after: { sourceType: returnRecord.sourceType, purchaseOrderId: String(order._id), warehouseId: String(warehouse._id), reason: input.reason, lines: [...requested].map(([productId, quantity]) => ({ productId, quantity })) } }, session);
      result = returnRecord;
    });
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) throw new HttpError(409, 'PURCHASE_RETURN_CONFLICT', 'Inventory changed concurrently; reload and try the purchase return again');
    throw error;
  } finally { await session.endSession(); }
};
