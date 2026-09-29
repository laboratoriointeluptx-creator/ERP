import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createCustomer, findCustomer, listCustomers, updateCustomer } from '../repositories/customer.repository.js';
import type { CreateCustomerInput, CustomerQuery, UpdateCustomerInput } from '../validators/customer.schemas.js';

export const registerCustomer = async (organizationId: string, input: CreateCustomerInput) => {
  try {
    return await createCustomer(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'CUSTOMER_CODE_EXISTS', 'Customer code already exists');
    }
    throw error;
  }
};

export const getCustomers = (organizationId: string, query: CustomerQuery) => listCustomers(organizationId, query);

export const modifyCustomer = async (organizationId: string, actorId: string, id: string, input: UpdateCustomerInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findCustomer(organizationId, id, session);
      if (!before) throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
      const updateResult = await updateCustomer(organizationId, id, input, session);
      if (updateResult.matchedCount !== 1) throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
      const updated = await findCustomer(organizationId, id, session);
      if (!updated) throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
      await recordAuditEvent({ organizationId, userId: actorId, action: input.active === undefined ? 'customer.updated' : input.active ? 'customer.activated' : 'customer.deactivated', module: 'customers', entity: 'Customer', entityId: id, ...(ip ? { ip } : {}), before: before.toObject(), after: updated.toObject() }, session);
      result = updated;
    });
    if (!result) throw new Error('Customer update transaction returned no result');
    return result;
  } finally { await session.endSession(); }
};
