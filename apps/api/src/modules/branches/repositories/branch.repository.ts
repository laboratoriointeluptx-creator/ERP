import type { ClientSession } from 'mongoose';
import { BranchModel, type Branch } from '../models/branch.model.js';
import type { BranchQuery, CreateBranchInput, UpdateBranchInput } from '../validators/branch.schemas.js';

export const createBranch = (organizationId: string, input: CreateBranchInput): Promise<Branch> =>
  BranchModel.create({ organizationId, ...input });
export const findBranch = (organizationId: string, id: string, session?: ClientSession) => BranchModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();
export const updateBranch = (organizationId: string, id: string, input: UpdateBranchInput, session?: ClientSession) =>
  BranchModel.updateOne({ _id: id, organizationId }, { $set: input }, { runValidators: true, ...(session ? { session } : {}) }).exec();

export const findActiveBranch = (organizationId: string, branchId: string): Promise<Branch | null> =>
  BranchModel.findOne({ _id: branchId, organizationId, active: true }).exec();

export const listBranches = async (organizationId: string, query: BranchQuery): Promise<{ items: Branch[]; total: number }> => {
  const escapedSearch = query.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    organizationId,
    active: query.active ?? true,
    ...(escapedSearch ? { $or: [{ code: new RegExp(escapedSearch, 'i') }, { name: new RegExp(escapedSearch, 'i') }] } : {}),
  };
  const [items, total] = await Promise.all([
    BranchModel.find(filter).sort({ name: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    BranchModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
