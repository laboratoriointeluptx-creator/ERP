import { BomModel } from '../models/bom.model.js';
import type { BomQuery, CreateBomInput, UpdateBomInput } from '../validators/bom.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createBom = (organizationId: string, input: CreateBomInput, session?: ClientSession) =>
  BomModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findBom = (organizationId: string, id: string, session?: ClientSession) =>
  BomModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findBomByCode = (organizationId: string, code: string, session?: ClientSession) =>
  BomModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const findActiveBomForProduct = (organizationId: string, productId: string, date = new Date(), session?: ClientSession) =>
  BomModel.findOne({
    organizationId,
    productId,
    status: 'ACTIVE',
    effectiveFrom: { $lte: date },
    $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: date } }],
  }).session(session ?? null).exec();

export const listBoms = async (organizationId: string, query: BomQuery) => {
  const filter: FilterQuery<typeof BomModel> = { organizationId };
  if (query.productId) filter.productId = query.productId;
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    BomModel.find(filter).sort({ productId: 1, version: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    BomModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateBom = (organizationId: string, id: string, input: UpdateBomInput, session?: ClientSession) =>
  BomModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteBom = (organizationId: string, id: string, session?: ClientSession) =>
  BomModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




