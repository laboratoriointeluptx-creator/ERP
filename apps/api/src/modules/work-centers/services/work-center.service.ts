import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createWorkCenter, findWorkCenter, findWorkCenterByCode, listWorkCenters, updateWorkCenter, deleteWorkCenter } from '../repositories/work-center.repository.js';
import type { CreateWorkCenterInput, WorkCenterQuery, UpdateWorkCenterInput } from '../validators/work-center.schemas.js';

export const registerWorkCenter = async (organizationId: string, input: CreateWorkCenterInput) => {
  try {
    return await createWorkCenter(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'WORK_CENTER_CODE_EXISTS', 'Work center code already exists');
    }
    throw error;
  }
};

export const getWorkCenters = (organizationId: string, query: WorkCenterQuery) => listWorkCenters(organizationId, query);

export const modifyWorkCenter = async (organizationId: string, actorId: string, id: string, input: UpdateWorkCenterInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findWorkCenter(organizationId, id, session);
      if (!before) throw new HttpError(404, 'WORK_CENTER_NOT_FOUND', 'Work center not found');
      const updated = await updateWorkCenter(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'WORK_CENTER_NOT_FOUND', 'Work center not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'work-center.updated' : input.isActive ? 'work-center.activated' : 'work-center.deactivated',
        module: 'work-centers',
        entity: 'WorkCenter',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Work center update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeWorkCenter = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findWorkCenter(organizationId, id, session);
      if (!before) throw new HttpError(404, 'WORK_CENTER_NOT_FOUND', 'Work center not found');
      const deleted = await deleteWorkCenter(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'WORK_CENTER_NOT_FOUND', 'Work center not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'work-center.deleted',
        module: 'work-centers',
        entity: 'WorkCenter',
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