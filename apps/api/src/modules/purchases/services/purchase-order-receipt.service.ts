import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { isGreaterThan, addDecimal, areEqual } from '../../../shared/decimal.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { ProductModel } from '../../products/models/product.model.js';
import { InventoryModel } from '../../inventory/models/inventory.model.js';
import { InventoryMovementModel } from '../../inventory/models/inventory-movement.model.js';
import { WarehouseModel } from '../../warehouses/models/warehouse.model.js';
import { PurchaseOrderModel } from '../models/purchase-order.model.js';
import type { ReceivePurchaseOrderInput } from '../validators/purchase-order.schemas.js';

export interface ReceivableOrderLine {
  productId: string;
  quantity: string;
  receivedQuantity?: string;
}

export interface ReceiptQuantity {
  productId: string;
  quantity: string;
}

export const calculateReceipt = (
  orderLines: readonly ReceivableOrderLine[],
  receiptLines: readonly ReceiptQuantity[],
): ReceivableOrderLine[] => {
  const orderProductIds = new Set(orderLines.map((line) => line.productId));
  if (orderProductIds.size !== orderLines.length) {
    throw new HttpError(409, 'AMBIGUOUS_PURCHASE_ORDER_LINES', 'Purchase order contains duplicate products and cannot be received safely');
  }
  const receivedByProduct = new Map(receiptLines.map((line) => [line.productId, line.quantity]));
  if (receivedByProduct.size !== receiptLines.length) {
    throw new HttpError(400, 'DUPLICATE_RECEIPT_PRODUCT', 'A product can appear only once per receipt');
  }

  for (const productId of receivedByProduct.keys()) {
    if (!orderProductIds.has(productId)) {
      throw new HttpError(400, 'PRODUCT_NOT_IN_PURCHASE_ORDER', 'Receipt contains a product that is not in the purchase order');
    }
  }

  const updatedLines = orderLines.map((line) => {
    const quantity = receivedByProduct.get(line.productId);
    if (!quantity) return { ...line, receivedQuantity: line.receivedQuantity ?? '0' };

    const alreadyReceived = line.receivedQuantity ?? '0';
    const nextReceived = addDecimal(alreadyReceived, quantity);
    if (isGreaterThan(nextReceived, line.quantity)) {
      throw new HttpError(409, 'PURCHASE_ORDER_QUANTITY_EXCEEDED', 'Received quantity exceeds the outstanding purchase order quantity');
    }
    return { ...line, receivedQuantity: nextReceived };
  });

  if (receiptLines.length === 0) {
    throw new HttpError(400, 'EMPTY_RECEIPT', 'At least one receipt line is required');
  }
  return updatedLines;
};

export const receivePurchaseOrder = async (
  organizationId: string,
  userId: string,
  orderId: string,
  input: ReceivePurchaseOrderInput,
  ip?: string,
) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const order = await PurchaseOrderModel.findOne({ _id: orderId, organizationId }).session(session).exec();
      if (!order) throw new HttpError(404, 'PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found');
      if (order.status !== 'SENT' && order.status !== 'PARTIALLY_RECEIVED') {
        throw new HttpError(409, 'PURCHASE_ORDER_NOT_RECEIVABLE', 'Purchase order must be sent before receiving goods');
      }

      const warehouse = await WarehouseModel.findOne({ _id: input.warehouseId, organizationId, active: true }).session(session).exec();
      if (!warehouse) throw new HttpError(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');

      const receiptLines = input.lines.map((line) => ({ productId: line.productId, quantity: line.quantity }));
      const orderLines = order.lines.map((line) => ({
        productId: String(line.productId),
        quantity: line.quantity,
        receivedQuantity: line.receivedQuantity ?? '0',
      }));
      const updatedLines = calculateReceipt(orderLines, receiptLines);
      const receivedProductIds = receiptLines.map((line) => line.productId);
      const products = await ProductModel.find({
        organizationId,
        active: true,
        _id: { $in: receivedProductIds },
      }).session(session).exec();
      if (products.length !== new Set(receivedProductIds).size) {
        throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'One or more receipt products were not found');
      }

      const previousStatus = order.status;
      for (const received of receiptLines) {
        const balance = await InventoryModel.findOne({
          organizationId,
          warehouseId: warehouse._id,
          productId: received.productId,
        }).session(session).exec();
        const currentQuantity = balance?.quantity ?? '0';
        const nextQuantity = addDecimal(currentQuantity, received.quantity);
        await InventoryModel.findOneAndUpdate(
          { organizationId, warehouseId: warehouse._id, productId: received.productId },
          { $set: { quantity: nextQuantity }, $setOnInsert: { reservedQuantity: '0' } },
          { upsert: true, new: true, runValidators: true, session },
        ).exec();
      }

      await InventoryMovementModel.create(receiptLines.map((line) => ({
        organizationId,
        warehouseId: warehouse._id,
        productId: line.productId,
        type: 'PURCHASE',
        quantity: line.quantity,
        referenceType: 'PURCHASE_ORDER',
        referenceId: String(order._id),
      })), { session });

      for (const line of order.lines) {
        const updated = updatedLines.find((candidate) => candidate.productId === String(line.productId));
        if (updated) line.receivedQuantity = updated.receivedQuantity ?? '0';
      }
      order.status = updatedLines.every((line) => areEqual(line.receivedQuantity ?? '0', line.quantity))
        ? 'RECEIVED'
        : 'PARTIALLY_RECEIVED';
      await order.save({ session });

      await recordAuditEvent({
        organizationId,
        userId,
        action: 'purchase-order.received',
        module: 'purchases',
        entity: 'PurchaseOrder',
        entityId: String(order._id),
        ...(ip ? { ip } : {}),
        before: { status: previousStatus },
        after: { status: order.status, warehouseId: String(warehouse._id), lines: receiptLines },
      }, session);
      result = order;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
