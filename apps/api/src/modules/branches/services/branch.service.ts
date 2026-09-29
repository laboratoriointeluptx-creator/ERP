import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createBranch, findBranch, listBranches, updateBranch } from '../repositories/branch.repository.js';
import { WarehouseModel } from '../../warehouses/models/warehouse.model.js';
import type { BranchQuery, CreateBranchInput, UpdateBranchInput } from '../validators/branch.schemas.js';

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

export const modifyBranch = async (organizationId: string, actorId: string, id: string, input: UpdateBranchInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBranch(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BRANCH_NOT_FOUND', 'Branch not found');
      if (input.active === false && await WarehouseModel.exists({ organizationId, branchId: id, active: true }).session(session)) {
        throw new HttpError(409, 'BRANCH_HAS_ACTIVE_WAREHOUSES', 'Deactivate or move this branch’s warehouses before deactivating the branch');
      }
      const update = await updateBranch(organizationId, id, input, session);
      if (update.matchedCount !== 1) throw new HttpError(404, 'BRANCH_NOT_FOUND', 'Branch not found');
      const after = await findBranch(organizationId, id, session);
      if (!after) throw new HttpError(404, 'BRANCH_NOT_FOUND', 'Branch not found');
      await recordAuditEvent({ organizationId, userId: actorId, action: input.active === undefined ? 'branch.updated' : input.active ? 'branch.activated' : 'branch.deactivated', module: 'branches', entity: 'Branch', entityId: id, ...(ip ? { ip } : {}), before: before.toObject(), after: after.toObject() }, session);
      result = after;
    });
    if (!result) throw new Error('Branch update transaction returned no result');
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) throw new HttpError(409, 'BRANCH_CODE_EXISTS', 'Branch code already exists');
    throw error;
  } finally { await session.endSession(); }
};
