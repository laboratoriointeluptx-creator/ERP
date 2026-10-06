import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createProject, findProject, findProjectByCode, listProjects, updateProject, deleteProject } from '../repositories/project.repository.js';
import { CustomerModel } from '../../customers/models/customer.model.js';
import { UserModel } from '../../users/models/user.model.js';
import type { CreateProjectInput, ProjectQuery, UpdateProjectInput } from '../validators/project.schemas.js';

export const registerProject = async (organizationId: string, input: CreateProjectInput) => {
  if (input.customerId) {
    const customer = await CustomerModel.findOne({ _id: input.customerId, organizationId }).exec();
    if (!customer) throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }
  if (input.projectManagerId) {
    const manager = await UserModel.findOne({ _id: input.projectManagerId, organizationId }).exec();
    if (!manager) throw new HttpError(404, 'MANAGER_NOT_FOUND', 'Project manager not found');
  }
  if (input.teamMembers?.length) {
    const members = await UserModel.find({ _id: { $in: input.teamMembers }, organizationId }).exec();
    if (members.length !== input.teamMembers.length) throw new HttpError(404, 'TEAM_MEMBERS_NOT_FOUND', 'Some team members not found');
  }

  try {
    return await createProject(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'PROJECT_CODE_EXISTS', 'Project code already exists');
    }
    throw error;
  }
};

export const getProjects = (organizationId: string, query: ProjectQuery) => listProjects(organizationId, query);

export const modifyProject = async (organizationId: string, actorId: string, id: string, input: UpdateProjectInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findProject(organizationId, id, session);
      if (!before) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Project not found');
      if (input.customerId && input.customerId !== String(before.customerId)) {
        const customer = await CustomerModel.findOne({ _id: input.customerId, organizationId }).session(session).exec();
        if (!customer) throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
      }
      if (input.projectManagerId && input.projectManagerId !== String(before.projectManagerId)) {
        const manager = await UserModel.findOne({ _id: input.projectManagerId, organizationId }).session(session).exec();
        if (!manager) throw new HttpError(404, 'MANAGER_NOT_FOUND', 'Project manager not found');
      }
      const updated = await updateProject(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Project not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'project.updated' : 'project.status_changed',
        module: 'projects',
        entity: 'Project',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Project update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeProject = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findProject(organizationId, id, session);
      if (!before) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Project not found');
      const deleted = await deleteProject(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Project not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'project.deleted',
        module: 'projects',
        entity: 'Project',
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