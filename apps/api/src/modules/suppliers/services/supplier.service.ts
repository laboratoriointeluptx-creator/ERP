import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createSupplier, findSupplier, listSuppliers, updateSupplier } from '../repositories/supplier.repository.js';
import type { CreateSupplierInput, SupplierQuery, UpdateSupplierInput } from '../validators/supplier.schemas.js';

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

export const modifySupplier = async (organizationId: string, actorId: string, id: string, input: UpdateSupplierInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findSupplier(organizationId, id, session);
      if (!before) throw new HttpError(404, 'SUPPLIER_NOT_FOUND', 'Supplier not found');
      const updateResult = await updateSupplier(organizationId, id, input, session);
      if (updateResult.matchedCount !== 1) throw new HttpError(404, 'SUPPLIER_NOT_FOUND', 'Supplier not found');
      const updated = await findSupplier(organizationId, id, session);
      if (!updated) throw new HttpError(404, 'SUPPLIER_NOT_FOUND', 'Supplier not found');
      await recordAuditEvent({ organizationId, userId: actorId, action: input.active === undefined ? 'supplier.updated' : input.active ? 'supplier.activated' : 'supplier.deactivated', module: 'suppliers', entity: 'Supplier', entityId: id, ...(ip ? { ip } : {}), before: before.toObject(), after: updated.toObject() }, session);
      result = updated;
    });
    if (!result) throw new Error('Supplier update transaction returned no result');
    return result;
  } finally { await session.endSession(); }
};
