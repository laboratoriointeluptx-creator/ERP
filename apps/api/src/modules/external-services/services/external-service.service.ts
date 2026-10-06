import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createExternalService, findExternalService, findExternalServiceByCode, getDefaultExternalService, listExternalServices, updateExternalService, deleteExternalService, updateHealthStatus } from '../repositories/external-service.repository.js';
import type { CreateExternalServiceInput, ExternalServiceQuery, UpdateExternalServiceInput } from '../validators/external-service.schemas.js';

export const registerExternalService = async (organizationId: string, input: CreateExternalServiceInput) => {
  if (input.isDefault) {
    const existing = await getDefaultExternalService(organizationId, input.type);
    if (existing) throw new HttpError(409, 'DEFAULT_SERVICE_EXISTS', 'A default service of this type already exists');
  }

  try {
    return await createExternalService(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'EXTERNAL_SERVICE_CODE_EXISTS', 'External service code already exists');
    }
    throw error;
  }
};

export const getExternalServices = (organizationId: string, query: ExternalServiceQuery) => listExternalServices(organizationId, query);

export const getDefaultService = (organizationId: string, type: string) => getDefaultExternalService(organizationId, type);

export const modifyExternalService = async (organizationId: string, actorId: string, id: string, input: UpdateExternalServiceInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findExternalService(organizationId, id, session);
      if (!before) throw new HttpError(404, 'EXTERNAL_SERVICE_NOT_FOUND', 'External service not found');
      if (input.isDefault && input.isDefault !== before.isDefault) {
        const existing = await getDefaultExternalService(organizationId, before.type);
        if (existing && String(existing._id) !== id) throw new HttpError(409, 'DEFAULT_SERVICE_EXISTS', 'A default service of this type already exists');
      }
      const updated = await updateExternalService(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'EXTERNAL_SERVICE_NOT_FOUND', 'External service not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'external-service.updated' : input.isActive ? 'external-service.activated' : 'external-service.deactivated',
        module: 'external-services',
        entity: 'ExternalService',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('External service update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeExternalService = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findExternalService(organizationId, id, session);
      if (!before) throw new HttpError(404, 'EXTERNAL_SERVICE_NOT_FOUND', 'External service not found');
      if (before.isDefault) throw new HttpError(409, 'DEFAULT_SERVICE', 'Cannot delete default external service');
      const deleted = await deleteExternalService(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'EXTERNAL_SERVICE_NOT_FOUND', 'External service not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'external-service.deleted',
        module: 'external-services',
        entity: 'ExternalService',
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

export const performHealthCheck = async (organizationId: string, id: string) => {
  // Health check logic would go here
  return updateHealthStatus(organizationId, id, 'HEALTHY', { checkedAt: new Date() });
};