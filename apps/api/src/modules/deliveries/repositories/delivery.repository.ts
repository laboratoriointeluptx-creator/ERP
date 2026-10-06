import { DeliveryModel } from '../models/delivery.model.js';
import type { DeliveryQuery, CreateDeliveryInput, UpdateDeliveryInput } from '../validators/delivery.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createDelivery = (organizationId: string, input: CreateDeliveryInput, session?: ClientSession) =>
  DeliveryModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findDelivery = (organizationId: string, id: string, session?: ClientSession) =>
  DeliveryModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findDeliveryByCode = (organizationId: string, code: string, session?: ClientSession) =>
  DeliveryModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listDeliveries = async (organizationId: string, query: DeliveryQuery) => {
  const filter: FilterQuery<typeof DeliveryModel> = { organizationId };
  if (query.status) filter.status = query.status;
  if (query.shipmentId) filter.shipmentId = query.shipmentId;
  if (query.carrierId) filter.carrierId = query.carrierId;
  if (query.dateFrom || query.dateTo) {
    filter.scheduledDate = {};
    if (query.dateFrom) filter.scheduledDate.$gte = query.dateFrom;
    if (query.dateTo) filter.scheduledDate.$lte = query.dateTo;
  }
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    DeliveryModel.find(filter).sort({ scheduledDate: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    DeliveryModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateDelivery = (organizationId: string, id: string, input: UpdateDeliveryInput, session?: ClientSession) =>
  DeliveryModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteDelivery = (organizationId: string, id: string, session?: ClientSession) =>
  DeliveryModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




