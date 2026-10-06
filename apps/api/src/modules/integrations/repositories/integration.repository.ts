import { IntegrationModel } from '../models/integration.model.js';
import type { IntegrationQuery, CreateIntegrationInput, UpdateIntegrationInput } from '../validators/integration.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createIntegration = (organizationId: string, input: CreateIntegrationInput, session?: ClientSession) =>
  IntegrationModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findIntegration = (organizationId: string, id: string, session?: ClientSession) =>
  IntegrationModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findIntegrationByCode = (organizationId: string, code: string, session?: ClientSession) =>
  IntegrationModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listIntegrations = async (organizationId: string, query: IntegrationQuery) => {
  const filter: FilterQuery<typeof IntegrationModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.provider) filter.provider = query.provider;
  if (query.status) filter.status = query.status;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    IntegrationModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    IntegrationModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateIntegration = (organizationId: string, id: string, input: UpdateIntegrationInput, session?: ClientSession) =>
  IntegrationModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteIntegration = (organizationId: string, id: string, session?: ClientSession) =>
  IntegrationModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




