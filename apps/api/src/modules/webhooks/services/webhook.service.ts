import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createWebhook, findWebhook, findWebhookByCode, listWebhooks, updateWebhook, deleteWebhook, findWebhooksByEvent } from '../repositories/webhook.repository.js';
import type { CreateWebhookInput, WebhookQuery, UpdateWebhookInput } from '../validators/webhook.schemas.js';

export const registerWebhook = async (organizationId: string, input: CreateWebhookInput) => {
  try {
    return await createWebhook(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'WEBHOOK_CODE_EXISTS', 'Webhook code already exists');
    }
    throw error;
  }
};

export const getWebhooks = (organizationId: string, query: WebhookQuery) => listWebhooks(organizationId, query);

export const getWebhooksForEvent = (organizationId: string, event: string) => findWebhooksByEvent(organizationId, event);

export const modifyWebhook = async (organizationId: string, actorId: string, id: string, input: UpdateWebhookInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findWebhook(organizationId, id, session);
      if (!before) throw new HttpError(404, 'WEBHOOK_NOT_FOUND', 'Webhook not found');
      const updated = await updateWebhook(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'WEBHOOK_NOT_FOUND', 'Webhook not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'webhook.updated' : input.isActive ? 'webhook.activated' : 'webhook.deactivated',
        module: 'webhooks',
        entity: 'Webhook',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Webhook update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeWebhook = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findWebhook(organizationId, id, session);
      if (!before) throw new HttpError(404, 'WEBHOOK_NOT_FOUND', 'Webhook not found');
      const deleted = await deleteWebhook(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'WEBHOOK_NOT_FOUND', 'Webhook not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'webhook.deleted',
        module: 'webhooks',
        entity: 'Webhook',
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

export const testWebhook = async (organizationId: string, id: string, testPayload: unknown) => {
  // Webhook test logic would go here
  return { webhookId: id, status: 'TEST_SENT', sentAt: new Date() };
};