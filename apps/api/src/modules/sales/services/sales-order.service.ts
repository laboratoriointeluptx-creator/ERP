import { HttpError } from '../../../shared/http.js';
import { addDecimal, isGreaterThan, subtractDecimal } from '../../../shared/decimal.js';
import mongoose from 'mongoose';
import { CustomerModel } from '../../customers/models/customer.model.js';
import { InventoryModel } from '../../inventory/models/inventory.model.js';
import { ProductModel } from '../../products/models/product.model.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { WarehouseModel } from '../../warehouses/models/warehouse.model.js';
import { SalesOrderModel } from '../models/sales-order.model.js';
import { createSalesOrder } from '../repositories/sales-order.repository.js';
import type { ConfirmSalesOrderInput, CreateSalesOrderInput } from '../validators/sales-order.schemas.js';

export const registerSalesOrder = async (organizationId: string, input: CreateSalesOrderInput) => {
  try {
    const productIds = input.lines.map((line) => line.productId);
    const [customer, products] = await Promise.all([
      CustomerModel.findOne({ _id: input.customerId, organizationId, active: true }).exec(),
      ProductModel.find({ _id: { $in: productIds }, organizationId, active: true }).exec(),
    ]);
    if (!customer) throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
    if (products.length !== productIds.length) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'One or more sales order products were not found');
    return await createSalesOrder(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'SALES_ORDER_CODE_EXISTS', 'Sales order code already exists');
    }
    throw error;
  }
};

export const availableStock = (quantity: string, reservedQuantity: string): string => {
  if (isGreaterThan(reservedQuantity, quantity)) {
    throw new HttpError(409, 'INVENTORY_BALANCE_INVALID', 'Reserved quantity exceeds on-hand inventory');
  }
  return subtractDecimal(quantity, reservedQuantity);
};

export const confirmSalesOrder = async (
  organizationId: string,
  userId: string,
  orderId: string,
  input: ConfirmSalesOrderInput,
  ip?: string,
) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const order = await SalesOrderModel.findOne({ _id: orderId, organizationId }).session(session).exec();
      if (!order) throw new HttpError(404, 'SALES_ORDER_NOT_FOUND', 'Sales order not found');
      if (order.status !== 'DRAFT') throw new HttpError(409, 'SALES_ORDER_NOT_CONFIRMABLE', 'Only draft sales orders can be confirmed');

      const warehouse = await WarehouseModel.findOne({ _id: input.warehouseId, organizationId, active: true }).session(session).exec();
      if (!warehouse) throw new HttpError(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');

      for (const line of order.lines) {
        const product = await ProductModel.findOne({ _id: line.productId, organizationId, active: true }).session(session).exec();
        if (!product) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'One or more sales order products were not found');
        const balance = await InventoryModel.findOne({
          organizationId,
          warehouseId: warehouse._id,
          productId: line.productId,
        }).session(session).exec();
        if (!balance) throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient available stock to confirm sales order');
        const quantity = balance.quantity;
        const reservedQuantity = balance.reservedQuantity;
        const available = availableStock(quantity, reservedQuantity);
        if (isGreaterThan(line.quantity, available)) {
          throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient available stock to confirm sales order');
        }
        await InventoryModel.findOneAndUpdate(
          { _id: balance._id, organizationId },
          { $set: { reservedQuantity: addDecimal(reservedQuantity, line.quantity) } },
          { new: true, runValidators: true, session },
        ).exec();
      }

      const previousStatus = order.status;
      order.status = 'CONFIRMED';
      order.warehouseId = warehouse._id;
      order.confirmedAt = new Date();
      await order.save({ session });
      await recordAuditEvent({
        organizationId,
        userId,
        action: 'sales-order.confirmed',
        module: 'sales',
        entity: 'SalesOrder',
        entityId: String(order._id),
        ...(ip ? { ip } : {}),
        before: { status: previousStatus },
        after: { status: order.status, warehouseId: String(warehouse._id) },
      }, session);
      result = order;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
