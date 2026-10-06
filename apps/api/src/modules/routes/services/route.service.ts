import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createRoute, findRoute, findRouteByCode, listRoutes, updateRoute, deleteRoute } from '../repositories/route.repository.js';
import { CarrierModel } from '../../carriers/models/carrier.model.js';
import type { CreateRouteInput, RouteQuery, UpdateRouteInput } from '../validators/route.schemas.js';

export const registerRoute = async (organizationId: string, input: CreateRouteInput) => {
  const carrier = await CarrierModel.findOne({ _id: input.carrierId, organizationId }).exec();
  if (!carrier) throw new HttpError(404, 'CARRIER_NOT_FOUND', 'Carrier not found');

  try {
    return await createRoute(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'ROUTE_CODE_EXISTS', 'Route code already exists');
    }
    throw error;
  }
};

export const getRoutes = (organizationId: string, query: RouteQuery) => listRoutes(organizationId, query);

export const modifyRoute = async (organizationId: string, actorId: string, id: string, input: UpdateRouteInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findRoute(organizationId, id, session);
      if (!before) throw new HttpError(404, 'ROUTE_NOT_FOUND', 'Route not found');
      if (input.carrierId && input.carrierId !== String(before.carrierId)) {
        const carrier = await CarrierModel.findOne({ _id: input.carrierId, organizationId }).session(session).exec();
        if (!carrier) throw new HttpError(404, 'CARRIER_NOT_FOUND', 'Carrier not found');
      }
      const updated = await updateRoute(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'ROUTE_NOT_FOUND', 'Route not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'route.updated' : input.isActive ? 'route.activated' : 'route.deactivated',
        module: 'routes',
        entity: 'Route',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Route update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeRoute = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findRoute(organizationId, id, session);
      if (!before) throw new HttpError(404, 'ROUTE_NOT_FOUND', 'Route not found');
      const deleted = await deleteRoute(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'ROUTE_NOT_FOUND', 'Route not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'route.deleted',
        module: 'routes',
        entity: 'Route',
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