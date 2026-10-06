import { ExternalServiceModel } from '../models/external-service.model.js';
import type { ExternalServiceQuery, CreateExternalServiceInput, UpdateExternalServiceInput } from '../validators/external-service.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createExternalService = (organizationId: string, input: CreateExternalServiceInput, session?: ClientSession) =>
  ExternalServiceModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findExternalService = (organizationId: string, id: string, session?: ClientSession) =>
  ExternalServiceModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findExternalServiceByCode = (organizationId: string, code: string, session?: ClientSession) =>
  ExternalServiceModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const getDefaultExternalService = (organizationId: string, type: string, session?: ClientSession) =>
  ExternalServiceModel.findOne({ organizationId, type, isDefault: true, isActive: true }).session(session ?? null).exec();

export const listExternalServices = async (organizationId: string, query: ExternalServiceQuery) => {
  const filter: FilterQuery<typeof ExternalServiceModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.provider) filter.provider = query.provider;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.isDefault !== undefined) filter.isDefault = query.isDefault;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    ExternalServiceModel.find(filter).sort({ isDefault: -1, createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    ExternalServiceModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateExternalService = (organizationId: string, id: string, input: UpdateExternalServiceInput, session?: ClientSession) =>
  ExternalServiceModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteExternalService = (organizationId: string, id: string, session?: ClientSession) =>
  ExternalServiceModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const updateHealthStatus = (organizationId: string, id: string, status: string, details: unknown, session?: ClientSession) =>
  ExternalServiceModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $set: { healthStatus: status, healthDetails: details, lastHealthCheck: new Date() } },
    { new: true, session: session ?? null },
  ).exec();




