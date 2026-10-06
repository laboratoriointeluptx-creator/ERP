import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createCarrier, findCarrier, findCarrierByCode, listCarriers, updateCarrier, deleteCarrier } from '../repositories/carrier.repository.js';
import type { CreateCarrierInput, CarrierQuery, UpdateCarrierInput } from '../validators/carrier.schemas.js';

export const registerCarrier = async (organizationId: string, input: CreateCarrierInput) => {
  try {
    return await createCarrier(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'CARRIER_CODE_EXISTS', 'Carrier code already exists');
    }
    throw error;
  }
};

export const getCarriers = (organizationId: string, query: CarrierQuery) => listCarriers(organizationId, query);

export const modifyCarrier = async (organizationId: string, actorId: string, id: string, input: UpdateCarrierInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findCarrier(organizationId, id, session);
      if (!before) throw new HttpError(404, 'CARRIER_NOT_FOUND', 'Carrier not found');
      const updated = await updateCarrier(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'CARRIER_NOT_FOUND', 'Carrier not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'carrier.updated' : input.isActive ? 'carrier.activated' : 'carrier.deactivated',
        module: 'carriers',
        entity: 'Carrier',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Carrier update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeCarrier = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findCarrier(organizationId, id, session);
      if (!before) throw new HttpError(404, 'CARRIER_NOT_FOUND', 'Carrier not found');
      const deleted = await deleteCarrier(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'CARRIER_NOT_FOUND', 'Carrier not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'carrier.deleted',
        module: 'carriers',
        entity: 'Carrier',
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