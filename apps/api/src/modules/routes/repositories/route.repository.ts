import { RouteModel } from '../models/route.model.js';
import type { RouteQuery, CreateRouteInput, UpdateRouteInput } from '../validators/route.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createRoute = (organizationId: string, input: CreateRouteInput, session?: ClientSession) =>
  RouteModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findRoute = (organizationId: string, id: string, session?: ClientSession) =>
  RouteModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findRouteByCode = (organizationId: string, code: string, session?: ClientSession) =>
  RouteModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listRoutes = async (organizationId: string, query: RouteQuery) => {
  const filter: FilterQuery<typeof RouteModel> = { organizationId };
  if (query.carrierId) filter.carrierId = query.carrierId;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    RouteModel.find(filter).sort({ code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    RouteModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateRoute = (organizationId: string, id: string, input: UpdateRouteInput, session?: ClientSession) =>
  RouteModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteRoute = (organizationId: string, id: string, session?: ClientSession) =>
  RouteModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




