import { CarrierModel } from '../models/carrier.model.js';
import type { CarrierQuery, CreateCarrierInput, UpdateCarrierInput } from '../validators/carrier.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createCarrier = (organizationId: string, input: CreateCarrierInput, session?: ClientSession) =>
  CarrierModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findCarrier = (organizationId: string, id: string, session?: ClientSession) =>
  CarrierModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findCarrierByCode = (organizationId: string, code: string, session?: ClientSession) =>
  CarrierModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listCarriers = async (organizationId: string, query: CarrierQuery) => {
  const filter: FilterQuery<typeof CarrierModel> = { organizationId };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.serviceLevel) filter.serviceLevel = query.serviceLevel;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    CarrierModel.find(filter).sort({ code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    CarrierModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateCarrier = (organizationId: string, id: string, input: UpdateCarrierInput, session?: ClientSession) =>
  CarrierModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteCarrier = (organizationId: string, id: string, session?: ClientSession) =>
  CarrierModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();



