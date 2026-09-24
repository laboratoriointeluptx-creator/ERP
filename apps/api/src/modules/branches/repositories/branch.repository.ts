import { BranchModel, type Branch } from '../models/branch.model.js';
import type { BranchQuery, CreateBranchInput } from '../validators/branch.schemas.js';

export const createBranch = (organizationId: string, input: CreateBranchInput): Promise<Branch> =>
  BranchModel.create({ organizationId, ...input });

export const listBranches = async (organizationId: string, query: BranchQuery): Promise<{ items: Branch[]; total: number }> => {
  const filter = { organizationId, active: true };
  const [items, total] = await Promise.all([
    BranchModel.find(filter).sort({ name: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    BranchModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
