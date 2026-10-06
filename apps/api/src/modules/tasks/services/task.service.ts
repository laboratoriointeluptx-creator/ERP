import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createTask, findTask, findTaskByCode, listTasks, updateTask, deleteTask } from '../repositories/task.repository.js';
import { TaskModel } from '../models/task.model.js';
import { ProjectModel } from '../../projects/models/project.model.js';
import { UserModel } from '../../users/models/user.model.js';
import type { CreateTaskInput, TaskQuery, UpdateTaskInput } from '../validators/task.schemas.js';

export const registerTask = async (organizationId: string, input: CreateTaskInput) => {
  const project = await ProjectModel.findOne({ _id: input.projectId, organizationId }).exec();
  if (!project) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  if (input.assigneeId) {
    const assignee = await UserModel.findOne({ _id: input.assigneeId, organizationId }).exec();
    if (!assignee) throw new HttpError(404, 'ASSIGNEE_NOT_FOUND', 'Assignee not found');
  }
  if (input.reporterId) {
    const reporter = await UserModel.findOne({ _id: input.reporterId, organizationId }).exec();
    if (!reporter) throw new HttpError(404, 'REPORTER_NOT_FOUND', 'Reporter not found');
  }
  if (input.parentTaskId) {
    const parent = await findTask(organizationId, input.parentTaskId);
    if (!parent) throw new HttpError(404, 'PARENT_TASK_NOT_FOUND', 'Parent task not found');
    if (String(parent.projectId) !== input.projectId) throw new HttpError(400, 'INVALID_PARENT', 'Parent task must be in same project');
  }
  if (input.dependsOn?.length) {
    const deps = await TaskModel.find({ _id: { $in: input.dependsOn }, organizationId }).exec();
    if (deps.length !== input.dependsOn.length) throw new HttpError(404, 'DEPENDENCIES_NOT_FOUND', 'Some dependencies not found');
  }

  try {
    return await createTask(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'TASK_CODE_EXISTS', 'Task code already exists in project');
    }
    throw error;
  }
};

export const getTasks = (organizationId: string, query: TaskQuery) => listTasks(organizationId, query);

export const modifyTask = async (organizationId: string, actorId: string, id: string, input: UpdateTaskInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findTask(organizationId, id, session);
      if (!before) throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
      if (input.assigneeId && input.assigneeId !== String(before.assigneeId)) {
        const assignee = await UserModel.findOne({ _id: input.assigneeId, organizationId }).session(session).exec();
        if (!assignee) throw new HttpError(404, 'ASSIGNEE_NOT_FOUND', 'Assignee not found');
      }
      const updated = await updateTask(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'task.updated' : 'task.status_changed',
        module: 'tasks',
        entity: 'Task',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Task update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeTask = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findTask(organizationId, id, session);
      if (!before) throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
      const deleted = await deleteTask(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'task.deleted',
        module: 'tasks',
        entity: 'Task',
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