import type { Types } from 'mongoose';
import { AuditLogModel } from '../models/audit-log.model.js';

export interface AuditEvent {
  organizationId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  action: string;
  module: string;
  entity: string;
  entityId: string;
  ip?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export const recordAuditEvent = (event: AuditEvent): Promise<unknown> =>
  AuditLogModel.create({
    ...event,
    before: sanitize(event.before),
    after: sanitize(event.after),
  });

const sanitize = (value: Record<string, unknown> | undefined): Record<string, unknown> | undefined => {
  if (!value) return undefined;
  const copy = { ...value };
  for (const key of ['password', 'passwordHash', 'accessToken', 'refreshToken', 'secret', 'apiKey']) {
    delete copy[key];
  }
  return copy;
};
