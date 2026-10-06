import { WorkCenterModel } from '../models/work-center.model.js';
import type { WorkCenterQuery, CreateWorkCenterInput, UpdateWorkCenterInput } from '../validators/work-center.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createWorkCenter = (organizationId: string, input: CreateWorkCenterInput, session?: ClientSession) =>
  WorkCenterModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findWorkCenter = (organizationId: string, id: string, session?: ClientSession) =>
  WorkCenterModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findWorkCenterByCode = (organizationId: string, code: string, session?: ClientSession) =>
  WorkCenterModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listWorkCenters = async (organizationId: string, query: WorkCenterQuery) => {
  const filter: FilterQuery<typeof WorkCenterModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    WorkCenterModel.find(filter).sort({ code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    WorkCenterModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateWorkCenter = (organizationId: string, id: string, input: UpdateWorkCenterInput, session?: ClientSession) =>
  WorkCenterModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteWorkCenter = (organizationId: string, id: string, session?: ClientSession) =>
  WorkCenterModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




