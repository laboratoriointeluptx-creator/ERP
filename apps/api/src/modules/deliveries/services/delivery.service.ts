import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createDelivery, findDelivery, findDeliveryByCode, listDeliveries, updateDelivery, deleteDelivery } from '../repositories/delivery.repository.js';
import { ShipmentModel } from '../../logistics/models/shipment.model.js';
import { CarrierModel } from '../../carriers/models/carrier.model.js';
import { RouteModel } from '../../routes/models/route.model.js';
import type { CreateDeliveryInput, DeliveryQuery, UpdateDeliveryInput } from '../validators/delivery.schemas.js';

export const registerDelivery = async (organizationId: string, input: CreateDeliveryInput) => {
  const shipment = await ShipmentModel.findOne({ _id: input.shipmentId, organizationId }).exec();
  if (!shipment) throw new HttpError(404, 'SHIPMENT_NOT_FOUND', 'Shipment not found');

  if (input.routeId) {
    const route = await RouteModel.findOne({ _id: input.routeId, organizationId }).exec();
    if (!route) throw new HttpError(404, 'ROUTE_NOT_FOUND', 'Route not found');
  }

  if (input.carrierId) {
    const carrier = await CarrierModel.findOne({ _id: input.carrierId, organizationId }).exec();
    if (!carrier) throw new HttpError(404, 'CARRIER_NOT_FOUND', 'Carrier not found');
  }

  try {
    return await createDelivery(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'DELIVERY_CODE_EXISTS', 'Delivery code already exists');
    }
    throw error;
  }
};

export const getDeliveries = (organizationId: string, query: DeliveryQuery) => listDeliveries(organizationId, query);

export const modifyDelivery = async (organizationId: string, actorId: string, id: string, input: UpdateDeliveryInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDelivery(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DELIVERY_NOT_FOUND', 'Delivery not found');
      const updated = await updateDelivery(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'DELIVERY_NOT_FOUND', 'Delivery not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'delivery.updated' : 'delivery.status_changed',
        module: 'deliveries',
        entity: 'Delivery',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Delivery update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeDelivery = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDelivery(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DELIVERY_NOT_FOUND', 'Delivery not found');
      const deleted = await deleteDelivery(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'DELIVERY_NOT_FOUND', 'Delivery not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'delivery.deleted',
        module: 'deliveries',
        entity: 'Delivery',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: null,
      }, session);
      result = deleted;
    });
    return result;
  } finally {
    await session.endSession();
  }
};