import type { ClientSession, Types } from 'mongoose';
import { AuditLogModel } from '../models/audit-log.model.js';

export interface AuditEvent {
  organizationId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  action: string;
  module: string;
  entity: string;
  entityId: string;
  ip?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export const recordAuditEvent = (event: AuditEvent, session?: ClientSession): Promise<unknown> =>
  AuditLogModel.create([{
    ...event,
    before: sanitize(event.before),
    after: sanitize(event.after),
  }], session ? { session } : {});

const sanitize = (value: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined => {
  if (value === null || value === undefined) return value;
  const copy = { ...value };
  for (const key of ['password', 'passwordHash', 'accessToken', 'refreshToken', 'secret', 'apiKey']) {
    delete copy[key];
  }
  return copy;
};
