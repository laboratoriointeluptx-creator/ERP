import { TaxModel } from '../models/tax.model.js';
import type { TaxQuery, CreateTaxInput, UpdateTaxInput } from '../validators/tax.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createTax = (organizationId: string, input: CreateTaxInput, session?: ClientSession) =>
  TaxModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findTax = (organizationId: string, id: string, session?: ClientSession) =>
  TaxModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findTaxByCode = (organizationId: string, code: string, session?: ClientSession) =>
  TaxModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listTaxes = async (organizationId: string, query: TaxQuery) => {
  const filter: FilterQuery<typeof TaxModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.appliesTo) filter.appliesTo = query.appliesTo;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    TaxModel.find(filter).sort({ code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    TaxModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateTax = (organizationId: string, id: string, input: UpdateTaxInput, session?: ClientSession) =>
  TaxModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteTax = (organizationId: string, id: string, session?: ClientSession) =>
  TaxModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const getActiveTaxesFor = (organizationId: string, appliesTo: 'SALE' | 'PURCHASE' | 'BOTH', date = new Date()) =>
  TaxModel.find({
    organizationId,
    isActive: true,
    effectiveFrom: { $lte: date },
    $and: [
      { $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: date } }] },
      { $or: [{ appliesTo: 'BOTH' }, { appliesTo }] },
    ],
  }).sort({ type: 1, rate: 1 }).exec();




