import { HttpError } from '../../../shared/http.js';
import { findActiveBranch } from '../../branches/repositories/branch.repository.js';
import { createWarehouse, listWarehouses } from '../repositories/warehouse.repository.js';
import type { CreateWarehouseInput, WarehouseQuery } from '../validators/warehouse.schemas.js';

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
