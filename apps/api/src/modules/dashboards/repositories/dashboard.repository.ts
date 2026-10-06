import { DashboardModel } from '../models/dashboard.model.js';
import type { DashboardQuery, CreateDashboardInput, UpdateDashboardInput } from '../validators/dashboard.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createDashboard = (organizationId: string, input: CreateDashboardInput, session?: ClientSession) =>
  DashboardModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findDashboard = (organizationId: string, id: string, session?: ClientSession) =>
  DashboardModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findDashboardByCode = (organizationId: string, code: string, session?: ClientSession) =>
  DashboardModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listDashboards = async (organizationId: string, query: DashboardQuery) => {
  const filter: FilterQuery<typeof DashboardModel> = { organizationId };
  if (query.isPublic !== undefined) filter.isPublic = query.isPublic;
  if (query.ownerId) filter.ownerId = query.ownerId;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    DashboardModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    DashboardModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateDashboard = (organizationId: string, id: string, input: UpdateDashboardInput, session?: ClientSession) =>
  DashboardModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteDashboard = (organizationId: string, id: string, session?: ClientSession) =>
  DashboardModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




