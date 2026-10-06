import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createIntegration, findIntegration, findIntegrationByCode, listIntegrations, updateIntegration, deleteIntegration } from '../repositories/integration.repository.js';
import type { CreateIntegrationInput, IntegrationQuery, UpdateIntegrationInput } from '../validators/integration.schemas.js';

export const registerIntegration = async (organizationId: string, input: CreateIntegrationInput) => {
  try {
    return await createIntegration(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'INTEGRATION_CODE_EXISTS', 'Integration code already exists');
    }
    throw error;
  }
};

export const getIntegrations = (organizationId: string, query: IntegrationQuery) => listIntegrations(organizationId, query);

export const modifyIntegration = async (organizationId: string, actorId: string, id: string, input: UpdateIntegrationInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findIntegration(organizationId, id, session);
      if (!before) throw new HttpError(404, 'INTEGRATION_NOT_FOUND', 'Integration not found');
      const updated = await updateIntegration(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'INTEGRATION_NOT_FOUND', 'Integration not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'integration.updated' : 'integration.status_changed',
        module: 'integrations',
        entity: 'Integration',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Integration update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeIntegration = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findIntegration(organizationId, id, session);
      if (!before) throw new HttpError(404, 'INTEGRATION_NOT_FOUND', 'Integration not found');
      const deleted = await deleteIntegration(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'INTEGRATION_NOT_FOUND', 'Integration not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'integration.deleted',
        module: 'integrations',
        entity: 'Integration',
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

export const syncIntegration = async (organizationId: string, id: string) => {
  // Integration sync logic would go here
  return { integrationId: id, status: 'SYNCING', startedAt: new Date() };
};