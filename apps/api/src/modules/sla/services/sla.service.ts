import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createSla, findSla, findSlaByCode, getDefaultSla, listSlas, updateSla, deleteSla } from '../repositories/sla.repository.js';
import type { CreateSlaInput, SlaQuery, UpdateSlaInput } from '../validators/sla.schemas.js';

export const registerSla = async (organizationId: string, input: CreateSlaInput) => {
  if (input.isDefault) {
    const existing = await getDefaultSla(organizationId);
    if (existing) throw new HttpError(409, 'DEFAULT_SLA_EXISTS', 'A default SLA already exists');
  }

  try {
    return await createSla(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'SLA_CODE_EXISTS', 'SLA code already exists');
    }
    throw error;
  }
};

export const getSlas = (organizationId: string, query: SlaQuery) => listSlas(organizationId, query);

export const getDefaultSlaForOrg = (organizationId: string) => getDefaultSla(organizationId);

export const modifySla = async (organizationId: string, actorId: string, id: string, input: UpdateSlaInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findSla(organizationId, id, session);
      if (!before) throw new HttpError(404, 'SLA_NOT_FOUND', 'SLA not found');
      if (input.isDefault && input.isDefault !== before.isDefault) {
        const existing = await getDefaultSla(organizationId);
        if (existing && String(existing._id) !== id) throw new HttpError(409, 'DEFAULT_SLA_EXISTS', 'A default SLA already exists');
      }
      const updated = await updateSla(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'SLA_NOT_FOUND', 'SLA not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'sla.updated' : input.isActive ? 'sla.activated' : 'sla.deactivated',
        module: 'sla',
        entity: 'SLA',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('SLA update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeSla = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findSla(organizationId, id, session);
      if (!before) throw new HttpError(404, 'SLA_NOT_FOUND', 'SLA not found');
      if (before.isDefault) throw new HttpError(409, 'DEFAULT_SLA', 'Cannot delete default SLA');
      const deleted = await deleteSla(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'SLA_NOT_FOUND', 'SLA not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'sla.deleted',
        module: 'sla',
        entity: 'SLA',
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