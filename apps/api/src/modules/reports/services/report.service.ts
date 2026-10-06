import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createReport, findReport, findReportByCode, listReports, updateReport, deleteReport } from '../repositories/report.repository.js';
import type { CreateReportInput, ReportQuery, UpdateReportInput } from '../validators/report.schemas.js';

export const registerReport = async (organizationId: string, input: CreateReportInput) => {
  try {
    return await createReport(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'REPORT_CODE_EXISTS', 'Report code already exists');
    }
    throw error;
  }
};

export const getReports = (organizationId: string, query: ReportQuery) => listReports(organizationId, query);

export const modifyReport = async (organizationId: string, actorId: string, id: string, input: UpdateReportInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findReport(organizationId, id, session);
      if (!before) throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found');
      const updated = await updateReport(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'report.updated',
        module: 'reports',
        entity: 'Report',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Report update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeReport = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findReport(organizationId, id, session);
      if (!before) throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found');
      const deleted = await deleteReport(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'report.deleted',
        module: 'reports',
        entity: 'Report',
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

export const executeReport = async (organizationId: string, id: string, parameters: Record<string, unknown>) => {
  const report = await findReport(organizationId, id);
  if (!report) throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found');
  // Report execution logic would go here
  return { reportId: id, status: 'EXECUTED', data: [], generatedAt: new Date() };
};