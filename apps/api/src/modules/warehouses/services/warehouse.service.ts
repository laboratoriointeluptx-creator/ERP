import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { findActiveBranch } from '../../branches/repositories/branch.repository.js';
import { createWarehouse, findWarehouse, listWarehouses, updateWarehouse } from '../repositories/warehouse.repository.js';
import type { CreateWarehouseInput, UpdateWarehouseInput, WarehouseQuery } from '../validators/warehouse.schemas.js';

export const registerWarehouse = async (organizationId: string, input: CreateWarehouseInput) => {
  if (input.branchId && !(await findActiveBranch(organizationId, input.branchId))) {
    throw new HttpError(404, 'BRANCH_NOT_FOUND', 'Branch not found');
  }
  try {
    return await createWarehouse(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'WAREHOUSE_CODE_EXISTS', 'Warehouse code already exists');
    }
    throw error;
  }
};

export const getWarehouses = (organizationId: string, query: WarehouseQuery) => listWarehouses(organizationId, query);

export const modifyWarehouse = async (organizationId: string, actorId: string, id: string, input: UpdateWarehouseInput, ip?: string) => {
  if (input.branchId && !(await findActiveBranch(organizationId, input.branchId))) throw new HttpError(404, 'BRANCH_NOT_FOUND', 'Branch not found');
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findWarehouse(organizationId, id, session);
      if (!before) throw new HttpError(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
      const update = await updateWarehouse(organizationId, id, input, session);
      if (update.matchedCount !== 1) throw new HttpError(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
      const after = await findWarehouse(organizationId, id, session);
      if (!after) throw new HttpError(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
      await recordAuditEvent({ organizationId, userId: actorId, action: input.active === undefined ? 'warehouse.updated' : input.active ? 'warehouse.activated' : 'warehouse.deactivated', module: 'warehouses', entity: 'Warehouse', entityId: id, ...(ip ? { ip } : {}), before: before.toObject(), after: after.toObject() }, session);
      result = after;
    });
    if (!result) throw new Error('Warehouse update transaction returned no result');
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) throw new HttpError(409, 'WAREHOUSE_CODE_EXISTS', 'Warehouse code already exists');
    throw error;
  } finally { await session.endSession(); }
};
