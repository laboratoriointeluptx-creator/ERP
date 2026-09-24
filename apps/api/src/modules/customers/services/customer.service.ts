import { HttpError } from '../../../shared/http.js';
import { createCustomer, listCustomers } from '../repositories/customer.repository.js';
import type { CreateCustomerInput, CustomerQuery } from '../validators/customer.schemas.js';

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
