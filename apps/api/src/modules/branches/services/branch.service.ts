import { HttpError } from '../../../shared/http.js';
import { createBranch, listBranches } from '../repositories/branch.repository.js';
import type { BranchQuery, CreateBranchInput } from '../validators/branch.schemas.js';

export const registerBranch = async (organizationId: string, input: CreateBranchInput) => {
  try {
    return await createBranch(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'BRANCH_CODE_EXISTS', 'Branch code already exists');
    }
    throw error;
  }
};

export const getBranches = (organizationId: string, query: BranchQuery) => listBranches(organizationId, query);
