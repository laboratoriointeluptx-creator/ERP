import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createForecast, findForecast, findForecastByCode, listForecasts, updateForecast, deleteForecast, getForecastsForPrediction } from '../repositories/forecast.repository.js';
import type { CreateForecastInput, ForecastQuery, UpdateForecastInput, ForecastParametersInput, ForecastDataSourceInput } from '../validators/forecast.schemas.js';

export const registerForecast = async (organizationId: string, input: CreateForecastInput) => {
  try {
    return await createForecast(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'FORECAST_CODE_EXISTS', 'Forecast code already exists');
    }
    throw error;
  }
};

export const getForecasts = (organizationId: string, query: ForecastQuery) => listForecasts(organizationId, query);

export const getForecastsForScheduling = (organizationId: string) => getForecastsForPrediction(organizationId);

export const modifyForecast = async (organizationId: string, actorId: string, id: string, input: UpdateForecastInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findForecast(organizationId, id, session);
      if (!before) throw new HttpError(404, 'FORECAST_NOT_FOUND', 'Forecast not found');
      const updated = await updateForecast(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'FORECAST_NOT_FOUND', 'Forecast not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'forecast.updated' : input.isActive ? 'forecast.activated' : 'forecast.deactivated',
        module: 'forecasting',
        entity: 'Forecast',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Forecast update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeForecast = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findForecast(organizationId, id, session);
      if (!before) throw new HttpError(404, 'FORECAST_NOT_FOUND', 'Forecast not found');
      const deleted = await deleteForecast(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'FORECAST_NOT_FOUND', 'Forecast not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'forecast.deleted',
        module: 'forecasting',
        entity: 'Forecast',
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

export const trainForecast = async (organizationId: string, id: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findForecast(organizationId, id, session);
      if (!before) throw new HttpError(404, 'FORECAST_NOT_FOUND', 'Forecast not found');
      const training = await updateForecast(organizationId, id, { status: 'TRAINING' }, session);
      if (!training) throw new HttpError(404, 'FORECAST_NOT_FOUND', 'Forecast not found');
      // Training logic would go here
      const trained = await updateForecast(organizationId, id, {
        status: 'TRAINED',
        training: { ...before.training, trainedAt: new Date(), metrics: { mae: '0', mape: '0', rmse: '0', r2: '0' } },
      }, session);
      if (!trained) throw new HttpError(404, 'FORECAST_NOT_FOUND', 'Forecast not found');
      await recordAuditEvent({
        organizationId,
        userId: 'system',
        action: 'forecast.trained',
        module: 'forecasting',
        entity: 'Forecast',
        entityId: id,
        before: before.toObject(),
        after: trained.toObject(),
      }, session);
      result = trained;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const predictForecast = async (organizationId: string, id: string) => {
  const forecast = await findForecast(organizationId, id);
  if (!forecast) throw new HttpError(404, 'FORECAST_NOT_FOUND', 'Forecast not found');
  if (forecast.status !== 'TRAINED' && forecast.status !== 'DEPLOYED') throw new HttpError(409, 'INVALID_STATUS', 'Forecast must be trained or deployed');
  // Prediction logic would go here
  return { forecastId: id, predictions: [], predictedAt: new Date() };
};