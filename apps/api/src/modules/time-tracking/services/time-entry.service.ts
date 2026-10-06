import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createTimeEntry, findTimeEntry, listTimeEntries, updateTimeEntry, approveTimeEntry, deleteTimeEntry } from '../repositories/time-entry.repository.js';
import { ProjectModel } from '../../projects/models/project.model.js';
import { TaskModel } from '../../tasks/models/task.model.js';
import { UserModel } from '../../users/models/user.model.js';
import type { CreateTimeEntryInput, TimeEntryQuery, UpdateTimeEntryInput, ApproveTimeEntryInput } from '../validators/time-entry.schemas.js';

export const registerTimeEntry = async (organizationId: string, input: CreateTimeEntryInput) => {
  if (input.projectId) {
    const project = await ProjectModel.findOne({ _id: input.projectId, organizationId }).exec();
    if (!project) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  if (input.taskId) {
    const task = await TaskModel.findOne({ _id: input.taskId, organizationId }).exec();
    if (!task) throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
  }

  try {
    return await createTimeEntry(organizationId, input);
  } catch (error: unknown) {
    throw error;
  }
};

export const getTimeEntries = (organizationId: string, query: TimeEntryQuery) => listTimeEntries(organizationId, query);

export const modifyTimeEntry = async (organizationId: string, actorId: string, id: string, input: UpdateTimeEntryInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findTimeEntry(organizationId, id, session);
      if (!before) throw new HttpError(404, 'TIME_ENTRY_NOT_FOUND', 'Time entry not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft time entries can be modified');
      const updated = await updateTimeEntry(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'TIME_ENTRY_NOT_FOUND', 'Time entry not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'time-entry.updated',
        module: 'time-tracking',
        entity: 'TimeEntry',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Time entry update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const approveEntry = async (organizationId: string, actorId: string, id: string, input: ApproveTimeEntryInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findTimeEntry(organizationId, id, session);
      if (!before) throw new HttpError(404, 'TIME_ENTRY_NOT_FOUND', 'Time entry not found');
      if (before.status !== 'SUBMITTED') throw new HttpError(409, 'NOT_SUBMITTED', 'Only submitted time entries can be approved');
      const updated = await approveTimeEntry(organizationId, id, input.approvedBy, session);
      if (!updated) throw new HttpError(404, 'TIME_ENTRY_NOT_FOUND', 'Time entry not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'time-entry.approved',
        module: 'time-tracking',
        entity: 'TimeEntry',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeTimeEntry = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findTimeEntry(organizationId, id, session);
      if (!before) throw new HttpError(404, 'TIME_ENTRY_NOT_FOUND', 'Time entry not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft time entries can be deleted');
      const deleted = await deleteTimeEntry(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'TIME_ENTRY_NOT_FOUND', 'Time entry not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'time-entry.deleted',
        module: 'time-tracking',
        entity: 'TimeEntry',
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