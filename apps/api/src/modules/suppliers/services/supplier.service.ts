import { HttpError } from '../../../shared/http.js';
import { createSupplier, listSuppliers } from '../repositories/supplier.repository.js';
import type { CreateSupplierInput, SupplierQuery } from '../validators/supplier.schemas.js';

export const registerSupplier = async (organizationId: string, input: CreateSupplierInput) => {
  try {
    return await createSupplier(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'SUPPLIER_CODE_EXISTS', 'Supplier code already exists');
    }
    throw error;
  }
};

export const getSuppliers = (organizationId: string, query: SupplierQuery) => listSuppliers(organizationId, query);
