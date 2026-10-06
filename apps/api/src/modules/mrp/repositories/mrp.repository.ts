import { MrpRunModel } from '../models/mrp.model.js';
import type { MrpRunQuery, CreateMrpRunInput, UpdateMrpRunInput } from '../validators/mrp.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createMrpRun = (organizationId: string, input: CreateMrpRunInput, session?: ClientSession) =>
  MrpRunModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findMrpRun = (organizationId: string, id: string, session?: ClientSession) =>
  MrpRunModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findMrpRunByCode = (organizationId: string, code: string, session?: ClientSession) =>
  MrpRunModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listMrpRuns = async (organizationId: string, query: MrpRunQuery) => {
  const filter: FilterQuery<typeof MrpRunModel> = { organizationId };
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    MrpRunModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    MrpRunModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateMrpRun = (organizationId: string, id: string, input: UpdateMrpRunInput, session?: ClientSession) =>
  MrpRunModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()




