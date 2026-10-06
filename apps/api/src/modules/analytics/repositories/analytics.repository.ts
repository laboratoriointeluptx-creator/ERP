import { AnalyticsEventModel, KpiModel } from '../models/analytics.model.js';
import type { KpiQuery, AnalyticsEventQuery, CreateKpiInput, UpdateKpiInput } from '../validators/analytics.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createKpi = (organizationId: string, input: CreateKpiInput, session?: ClientSession) =>
  KpiModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findKpi = (organizationId: string, id: string, session?: ClientSession) =>
  KpiModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findKpiByCode = (organizationId: string, code: string, session?: ClientSession) =>
  KpiModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listKpis = async (organizationId: string, query: KpiQuery) => {
  const filter: FilterQuery<typeof KpiModel> = { organizationId };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.frequency) filter.frequency = query.frequency;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    KpiModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    KpiModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateKpi = (organizationId: string, id: string, input: UpdateKpiInput, session?: ClientSession) =>
  KpiModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteKpi = (organizationId: string, id: string, session?: ClientSession) =>
  KpiModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const listAnalyticsEvents = async (organizationId: string, query: AnalyticsEventQuery) => {
  const filter: FilterQuery<typeof AnalyticsEventModel> = { organizationId };
  if (query.eventName) filter.eventName = query.eventName;
  if (query.eventCategory) filter.eventCategory = query.eventCategory;
  if (query.userId) filter.userId = query.userId;
  if (query.dateFrom || query.dateTo) {
    filter.timestamp = {};
    if (query.dateFrom) filter.timestamp.$gte = query.dateFrom;
    if (query.dateTo) filter.timestamp.$lte = query.dateTo;
  }
  if (query.search) filter.$or = [{ eventName: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    AnalyticsEventModel.find(filter).sort({ timestamp: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    AnalyticsEventModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};




