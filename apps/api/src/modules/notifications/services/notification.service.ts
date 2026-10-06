import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createNotification, findNotification, findNotificationByCode, listNotifications, updateNotification, deleteNotification, findNotificationsByTrigger, recordNotificationDelivery } from '../repositories/notification.repository.js';
import type { CreateNotificationInput, NotificationQuery, UpdateNotificationInput } from '../validators/notification.schemas.js';
import { emailService } from '../../email/email.module.js';

export const registerNotification = async (organizationId: string, input: CreateNotificationInput) => {
  try {
    return await createNotification(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'NOTIFICATION_CODE_EXISTS', 'Notification code already exists');
    }
    throw error;
  }
};

export const getNotifications = (organizationId: string, query: NotificationQuery) => listNotifications(organizationId, query);

export const getNotificationsForTrigger = (organizationId: string, event: string, module: string) =>
  findNotificationsByTrigger(organizationId, event, module);

const renderPlainTextTemplate = (template: string, variables: Record<string, string | number | boolean>): string =>
  template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, rawName: string) => {
    const name = rawName.trim();
    if (!Object.hasOwn(variables, name)) {
      throw new HttpError(422, 'NOTIFICATION_VARIABLE_MISSING', 'A notification template variable is missing');
    }
    return String(variables[name]);
  });

export const deliverEmailNotification = async (
  organizationId: string,
  notificationId: string,
  from: string,
  variables: Record<string, string | number | boolean> = {},
) => {
  const notification = await findNotification(organizationId, notificationId);
  if (!notification) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  if (notification.status !== 'ACTIVE' || notification.type !== 'EMAIL' || notification.channel !== 'EMAIL') {
    throw new HttpError(409, 'NOTIFICATION_NOT_DELIVERABLE', 'Notification is not an active email notification');
  }

  const recipients = notification.recipients?.emails;
  if (!recipients?.length) {
    throw new HttpError(422, 'NOTIFICATION_RECIPIENTS_MISSING', 'Notification has no configured email recipients');
  }
  if (!notification.template) {
    throw new HttpError(422, 'NOTIFICATION_TEMPLATE_MISSING', 'Notification has no configured email template');
  }

  const subject = renderPlainTextTemplate(notification.template.subject ?? notification.name, variables);
  const text = renderPlainTextTemplate(notification.template.body, variables);
  let result: { id: string };
  try {
    result = await emailService.sendTransactional({ from, to: recipients, subject, text });
  } catch (error: unknown) {
    await recordNotificationDelivery(organizationId, notificationId, false);
    throw error;
  }
  await recordNotificationDelivery(organizationId, notificationId, true);
  return result;
};

export const modifyNotification = async (organizationId: string, actorId: string, id: string, input: UpdateNotificationInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findNotification(organizationId, id, session);
      if (!before) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
      const updated = await updateNotification(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'notification.updated' : 'notification.status_changed',
        module: 'notifications',
        entity: 'Notification',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Notification update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeNotification = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findNotification(organizationId, id, session);
      if (!before) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
      const deleted = await deleteNotification(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'notification.deleted',
        module: 'notifications',
        entity: 'Notification',
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