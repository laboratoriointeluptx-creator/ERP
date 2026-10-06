import { ContractModel } from '../models/contract.model.js';
import type { ContractQuery, CreateContractInput, UpdateContractInput } from '../validators/contract.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createContract = (organizationId: string, input: CreateContractInput, session?: ClientSession) =>
  ContractModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findContract = (organizationId: string, id: string, session?: ClientSession) =>
  ContractModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findContractByCode = (organizationId: string, code: string, session?: ClientSession) =>
  ContractModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listContracts = async (organizationId: string, query: ContractQuery) => {
  const filter: FilterQuery<typeof ContractModel> = { organizationId };
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.dateFrom || query.dateTo) {
    filter.effectiveDate = {};
    if (query.dateFrom) filter.effectiveDate.$gte = query.dateFrom;
    if (query.dateTo) filter.effectiveDate.$lte = query.dateTo;
  }
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    ContractModel.find(filter).sort({ effectiveDate: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    ContractModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateContract = (organizationId: string, id: string, input: UpdateContractInput, session?: ClientSession) =>
  ContractModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteContract = (organizationId: string, id: string, session?: ClientSession) =>
  ContractModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




