import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createSetting, findSetting, listSettings, updateSetting, deleteSetting } from '../repositories/setting.repository.js';
import type { CreateSettingInput, SettingQuery, UpdateSettingInput } from '../validators/setting.schemas.js';

export const registerSetting = async (organizationId: string, input: CreateSettingInput) => {
  try {
    return await createSetting(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'SETTING_EXISTS', 'Setting already exists for this scope');
    }
    throw error;
  }
};

export const getSettings = (organizationId: string, query: SettingQuery) => listSettings(organizationId, query);

export const modifySetting = async (organizationId: string, actorId: string, key: string, input: UpdateSettingInput, scope = 'organization', branchId?: string, userId?: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findSetting(organizationId, key, scope, branchId, userId, session);
      if (!before) throw new HttpError(404, 'SETTING_NOT_FOUND', 'Setting not found');
      const updated = await updateSetting(organizationId, key, input, scope, branchId, userId, session);
      if (!updated) throw new HttpError(404, 'SETTING_NOT_FOUND', 'Setting not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'setting.updated',
        module: 'settings',
        entity: 'Setting',
        entityId: key,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Setting update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeSetting = async (organizationId: string, actorId: string, key: string, scope = 'organization', branchId?: string, userId?: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findSetting(organizationId, key, scope, branchId, userId, session);
      if (!before) throw new HttpError(404, 'SETTING_NOT_FOUND', 'Setting not found');
      const deleted = await deleteSetting(organizationId, key, scope, branchId, userId, session);
      if (!deleted) throw new HttpError(404, 'SETTING_NOT_FOUND', 'Setting not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'setting.deleted',
        module: 'settings',
        entity: 'Setting',
        entityId: key,
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