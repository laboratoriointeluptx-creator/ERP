import { ServiceOrderModel } from '../models/service-order.model.js';
import type { ServiceOrderQuery, CreateServiceOrderInput, UpdateServiceOrderInput } from '../validators/service-order.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createServiceOrder = (organizationId: string, input: CreateServiceOrderInput, session?: ClientSession) =>
  ServiceOrderModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findServiceOrder = (organizationId: string, id: string, session?: ClientSession) =>
  ServiceOrderModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findServiceOrderByCode = (organizationId: string, code: string, session?: ClientSession) =>
  ServiceOrderModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listServiceOrders = async (organizationId: string, query: ServiceOrderQuery) => {
  const filter: FilterQuery<typeof ServiceOrderModel> = { organizationId };
  if (query.status) filter.status = query.status;
  if (query.customerId) filter.customerId = query.customerId;
  if (query.assignedTechnicianId) filter.assignedTechnicianId = query.assignedTechnicianId;
  if (query.type) filter.type = query.type;
  if (query.dateFrom || query.dateTo) {
    filter.scheduledDate = {};
    if (query.dateFrom) filter.scheduledDate.$gte = query.dateFrom;
    if (query.dateTo) filter.scheduledDate.$lte = query.dateTo;
  }
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    ServiceOrderModel.find(filter).sort({ scheduledDate: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    ServiceOrderModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateServiceOrder = (organizationId: string, id: string, input: UpdateServiceOrderInput, session?: ClientSession) =>
  ServiceOrderModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteServiceOrder = (organizationId: string, id: string, session?: ClientSession) =>
  ServiceOrderModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




