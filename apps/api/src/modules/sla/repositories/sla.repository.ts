import { SlaModel } from '../models/sla.model.js';
import type { SlaQuery, CreateSlaInput, UpdateSlaInput } from '../validators/sla.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createSla = (organizationId: string, input: CreateSlaInput, session?: ClientSession) =>
  SlaModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findSla = (organizationId: string, id: string, session?: ClientSession) =>
  SlaModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findSlaByCode = (organizationId: string, code: string, session?: ClientSession) =>
  SlaModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const getDefaultSla = (organizationId: string, session?: ClientSession) =>
  SlaModel.findOne({ organizationId, isDefault: true, isActive: true }).session(session ?? null).exec();

export const listSlas = async (organizationId: string, query: SlaQuery) => {
  const filter: FilterQuery<typeof SlaModel> = { organizationId };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.isDefault !== undefined) filter.isDefault = query.isDefault;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    SlaModel.find(filter).sort({ isDefault: -1, code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    SlaModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateSla = (organizationId: string, id: string, input: UpdateSlaInput, session?: ClientSession) =>
  SlaModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteSla = (organizationId: string, id: string, session?: ClientSession) =>
  SlaModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




