import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createKpi, findKpi, findKpiByCode, listKpis, updateKpi, deleteKpi, listAnalyticsEvents } from '../repositories/analytics.repository.js';
import type { CreateKpiInput, KpiQuery, UpdateKpiInput, AnalyticsEventQuery } from '../validators/analytics.schemas.js';

export const registerKpi = async (organizationId: string, input: CreateKpiInput) => {
  try {
    return await createKpi(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'KPI_CODE_EXISTS', 'KPI code already exists');
    }
    throw error;
  }
};

export const getKpis = (organizationId: string, query: KpiQuery) => listKpis(organizationId, query);

export const getAnalyticsEvents = (organizationId: string, query: AnalyticsEventQuery) => listAnalyticsEvents(organizationId, query);

export const modifyKpi = async (organizationId: string, actorId: string, id: string, input: UpdateKpiInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findKpi(organizationId, id, session);
      if (!before) throw new HttpError(404, 'KPI_NOT_FOUND', 'KPI not found');
      const updated = await updateKpi(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'KPI_NOT_FOUND', 'KPI not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'kpi.updated' : input.isActive ? 'kpi.activated' : 'kpi.deactivated',
        module: 'analytics',
        entity: 'KPI',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('KPI update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeKpi = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findKpi(organizationId, id, session);
      if (!before) throw new HttpError(404, 'KPI_NOT_FOUND', 'KPI not found');
      const deleted = await deleteKpi(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'KPI_NOT_FOUND', 'KPI not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'kpi.deleted',
        module: 'analytics',
        entity: 'KPI',
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

export const calculateKpi = async (organizationId: string, id: string) => {
  const kpi = await findKpi(organizationId, id);
  if (!kpi) throw new HttpError(404, 'KPI_NOT_FOUND', 'KPI not found');
  // KPI calculation logic would go here
  return { kpiId: id, value: '0', calculatedAt: new Date() };
};