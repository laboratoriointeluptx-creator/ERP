import { ForecastModel } from '../models/forecast.model.js';
import type { ForecastQuery, CreateForecastInput, UpdateForecastInput } from '../validators/forecast.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createForecast = (organizationId: string, input: CreateForecastInput, session?: ClientSession) =>
  ForecastModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findForecast = (organizationId: string, id: string, session?: ClientSession) =>
  ForecastModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findForecastByCode = (organizationId: string, code: string, session?: ClientSession) =>
  ForecastModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listForecasts = async (organizationId: string, query: ForecastQuery) => {
  const filter: FilterQuery<typeof ForecastModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.model) filter.model = query.model;
  if (query.status) filter.status = query.status;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    ForecastModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    ForecastModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateForecast = (organizationId: string, id: string, input: UpdateForecastInput, session?: ClientSession) =>
  ForecastModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteForecast = (organizationId: string, id: string, session?: ClientSession) =>
  ForecastModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const getForecastsForPrediction = (organizationId: string, now = new Date()) =>
  ForecastModel.find({ organizationId, isActive: true, nextPredictionAt: { $lte: now } }).exec();




