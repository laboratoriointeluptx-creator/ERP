import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createDashboard, findDashboard, findDashboardByCode, listDashboards, updateDashboard, deleteDashboard } from '../repositories/dashboard.repository.js';
import { DashboardModel } from '../models/dashboard.model.js';
import { ReportModel } from '../../reports/models/report.model.js';
import { UserModel } from '../../users/models/user.model.js';
import type { CreateDashboardInput, DashboardQuery, UpdateDashboardInput } from '../validators/dashboard.schemas.js';

export const registerDashboard = async (organizationId: string, input: CreateDashboardInput) => {
  const owner = await UserModel.findOne({ _id: input.ownerId, organizationId }).exec();
  if (!owner) throw new HttpError(404, 'OWNER_NOT_FOUND', 'Owner not found');
  for (const widget of input.widgets ?? []) {
    const report = await ReportModel.findOne({ _id: widget.reportId, organizationId }).exec();
    if (!report) throw new HttpError(404, 'REPORT_NOT_FOUND', `Report ${widget.reportId} not found`);
  }
  if (input.isDefault) {
    const existing = await DashboardModel.findOne({ organizationId, isDefault: true }).exec();
    if (existing) throw new HttpError(409, 'DEFAULT_DASHBOARD_EXISTS', 'A default dashboard already exists');
  }

  try {
    return await createDashboard(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'DASHBOARD_CODE_EXISTS', 'Dashboard code already exists');
    }
    throw error;
  }
};

export const getDashboards = (organizationId: string, query: DashboardQuery) => listDashboards(organizationId, query);

export const modifyDashboard = async (organizationId: string, actorId: string, id: string, input: UpdateDashboardInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDashboard(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DASHBOARD_NOT_FOUND', 'Dashboard not found');
      if (input.isDefault && input.isDefault !== before.isDefault) {
        const existing = await DashboardModel.findOne({ organizationId, isDefault: true }).session(session).exec();
        if (existing && String(existing._id) !== id) throw new HttpError(409, 'DEFAULT_DASHBOARD_EXISTS', 'A default dashboard already exists');
      }
      for (const widget of input.widgets ?? []) {
        const report = await ReportModel.findOne({ _id: widget.reportId, organizationId }).session(session).exec();
        if (!report) throw new HttpError(404, 'REPORT_NOT_FOUND', `Report ${widget.reportId} not found`);
      }
      const updated = await updateDashboard(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'DASHBOARD_NOT_FOUND', 'Dashboard not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'dashboard.updated',
        module: 'dashboards',
        entity: 'Dashboard',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Dashboard update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeDashboard = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDashboard(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DASHBOARD_NOT_FOUND', 'Dashboard not found');
      if (before.isDefault) throw new HttpError(409, 'DEFAULT_DASHBOARD', 'Cannot delete default dashboard');
      const deleted = await deleteDashboard(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'DASHBOARD_NOT_FOUND', 'Dashboard not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'dashboard.deleted',
        module: 'dashboards',
        entity: 'Dashboard',
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