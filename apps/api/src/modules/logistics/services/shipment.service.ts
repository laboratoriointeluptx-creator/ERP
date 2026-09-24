import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { isGreaterThan, subtractDecimal } from '../../../shared/decimal.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { InventoryModel } from '../../inventory/models/inventory.model.js';
import { InventoryMovementModel } from '../../inventory/models/inventory-movement.model.js';
import { SalesOrderModel } from '../../sales/models/sales-order.model.js';
import { releaseReservation } from '../../sales/services/sales-order.service.js';
import { ShipmentModel } from '../models/shipment.model.js';
import { createShipment as createShipmentRecord } from '../repositories/shipment.repository.js';
import type { CreateShipmentInput } from '../validators/shipment.schemas.js';

export const calculateShipmentBalance = (
  onHand: string,
  reserved: string,
  shipped: string,
): { quantity: string; reservedQuantity: string } => {
  if (isGreaterThan(shipped, onHand)) {
    throw new HttpError(409, 'INVENTORY_STOCK_INVALID', 'On-hand quantity is lower than the shipment quantity');
  }
  return { quantity: subtractDecimal(onHand, shipped), reservedQuantity: releaseReservation(reserved, shipped) };
};

export const isShipmentDeliverable = (status: string): boolean => status === 'SHIPPED' || status === 'IN_TRANSIT';

export const registerShipment = async (organizationId: string, userId: string, input: CreateShipmentInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const order = await SalesOrderModel.findOne({ _id: input.salesOrderId, organizationId }).session(session).exec();
      if (!order) throw new HttpError(404, 'SALES_ORDER_NOT_FOUND', 'Sales order not found');
      if (order.status !== 'CONFIRMED' || !order.warehouseId) {
        throw new HttpError(409, 'SALES_ORDER_NOT_READY_TO_SHIP', 'Sales order must be confirmed and reserved before shipment');
      }
      const existingShipment = await ShipmentModel.findOne({
        organizationId,
        salesOrderId: order._id,
        status: { $ne: 'CANCELLED' },
      }).session(session).exec();
      if (existingShipment) throw new HttpError(409, 'SALES_ORDER_ALREADY_HAS_SHIPMENT', 'Sales order already has an active shipment');

      const previousStatus = order.status;
      order.status = 'PREPARING';
      await order.save({ session });
      const shipment = await createShipmentRecord(organizationId, input, session);
      await recordAuditEvent({
        organizationId,
        userId,
        action: 'shipment.created',
        module: 'logistics',
        entity: 'Shipment',
        entityId: String(shipment._id),
        ...(ip ? { ip } : {}),
        before: { salesOrderStatus: previousStatus },
        after: { shipmentStatus: shipment.status, salesOrderId: String(order._id) },
      }, session);
      result = shipment;
    });
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'SHIPMENT_NUMBER_EXISTS', 'Shipment number already exists');
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

export const dispatchShipment = async (organizationId: string, userId: string, shipmentId: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const shipment = await ShipmentModel.findOne({ _id: shipmentId, organizationId }).session(session).exec();
      if (!shipment) throw new HttpError(404, 'SHIPMENT_NOT_FOUND', 'Shipment not found');
      if (shipment.status !== 'PENDING' && shipment.status !== 'PREPARING') {
        throw new HttpError(409, 'SHIPMENT_NOT_DISPATCHABLE', 'Shipment is not pending dispatch');
      }
      const order = await SalesOrderModel.findOne({
        _id: shipment.salesOrderId,
        organizationId,
        status: 'PREPARING',
      }).session(session).exec();
      if (!order?.warehouseId) throw new HttpError(409, 'SALES_ORDER_NOT_PREPARING', 'Sales order is not being prepared');

      for (const line of order.lines) {
        const balance = await InventoryModel.findOne({
          organizationId,
          warehouseId: order.warehouseId,
          productId: line.productId,
        }).session(session).exec();
        if (!balance) throw new HttpError(409, 'INVENTORY_BALANCE_NOT_FOUND', 'Reserved inventory balance was not found');
        const next = calculateShipmentBalance(balance.quantity, balance.reservedQuantity, line.quantity);
        await InventoryModel.updateOne(
          { _id: balance._id, organizationId },
          { $set: next },
          { runValidators: true, session },
        ).exec();
        await InventoryMovementModel.create([{
          organizationId,
          warehouseId: order.warehouseId,
          productId: line.productId,
          type: 'SALE',
          quantity: line.quantity,
          referenceType: 'SALES_ORDER',
          referenceId: String(order._id),
        }], { session });
      }

      const previousShipmentStatus = shipment.status;
      shipment.status = 'SHIPPED';
      shipment.shippedAt = new Date();
      order.status = 'SHIPPED';
      await shipment.save({ session });
      await order.save({ session });
      await recordAuditEvent({
        organizationId,
        userId,
        action: 'shipment.dispatched',
        module: 'logistics',
        entity: 'Shipment',
        entityId: String(shipment._id),
        ...(ip ? { ip } : {}),
        before: { status: previousShipmentStatus },
        after: { status: shipment.status, salesOrderId: String(order._id) },
      }, session);
      result = shipment;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const cancelShipment = async (organizationId: string, userId: string, shipmentId: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const shipment = await ShipmentModel.findOne({ _id: shipmentId, organizationId }).session(session).exec();
      if (!shipment) throw new HttpError(404, 'SHIPMENT_NOT_FOUND', 'Shipment not found');
      if (shipment.status !== 'PENDING' && shipment.status !== 'PREPARING') {
        throw new HttpError(409, 'SHIPMENT_NOT_CANCELLABLE', 'Only pending shipments can be cancelled');
      }
      const order = await SalesOrderModel.findOne({ _id: shipment.salesOrderId, organizationId, status: 'PREPARING' }).session(session).exec();
      if (!order?.warehouseId) throw new HttpError(409, 'SALES_ORDER_NOT_PREPARING', 'Sales order is not being prepared');

      for (const line of order.lines) {
        const balance = await InventoryModel.findOne({ organizationId, warehouseId: order.warehouseId, productId: line.productId }).session(session).exec();
        if (!balance) throw new HttpError(409, 'INVENTORY_BALANCE_NOT_FOUND', 'Reserved inventory balance was not found');
        await InventoryModel.updateOne(
          { _id: balance._id, organizationId },
          { $set: { reservedQuantity: releaseReservation(balance.reservedQuantity, line.quantity) } },
          { runValidators: true, session },
        ).exec();
      }

      shipment.status = 'CANCELLED';
      order.status = 'CANCELLED';
      await shipment.save({ session });
      await order.save({ session });
      await recordAuditEvent({
        organizationId,
        userId,
        action: 'shipment.cancelled',
        module: 'logistics',
        entity: 'Shipment',
        entityId: String(shipment._id),
        ...(ip ? { ip } : {}),
        after: { status: shipment.status, salesOrderId: String(order._id) },
      }, session);
      result = shipment;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const deliverShipment = async (organizationId: string, userId: string, shipmentId: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const shipment = await ShipmentModel.findOne({ _id: shipmentId, organizationId }).session(session).exec();
      if (!shipment) throw new HttpError(404, 'SHIPMENT_NOT_FOUND', 'Shipment not found');
      if (!isShipmentDeliverable(shipment.status)) {
        throw new HttpError(409, 'SHIPMENT_NOT_DELIVERABLE', 'Shipment must be shipped before it can be delivered');
      }
      const order = await SalesOrderModel.findOne({ _id: shipment.salesOrderId, organizationId, status: 'SHIPPED' }).session(session).exec();
      if (!order) throw new HttpError(409, 'SALES_ORDER_NOT_SHIPPED', 'Sales order is not in the shipped state');

      shipment.status = 'DELIVERED';
      shipment.deliveredAt = new Date();
      order.status = 'COMPLETED';
      await shipment.save({ session });
      await order.save({ session });
      await recordAuditEvent({
        organizationId,
        userId,
        action: 'shipment.delivered',
        module: 'logistics',
        entity: 'Shipment',
        entityId: String(shipment._id),
        ...(ip ? { ip } : {}),
        after: { status: shipment.status, salesOrderId: String(order._id) },
      }, session);
      result = shipment;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
