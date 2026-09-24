import { CustomerModel, type Customer } from '../models/customer.model.js';
import type { CreateCustomerInput, CustomerQuery } from '../validators/customer.schemas.js';

export const createCustomer = (organizationId: string, input: CreateCustomerInput): Promise<Customer> =>
  CustomerModel.create({ organizationId, ...input });

export const listCustomers = async (
  organizationId: string,
  query: CustomerQuery,
): Promise<{ items: Customer[]; total: number }> => {
  const escapedSearch = query.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    organizationId,
    active: true,
    ...(escapedSearch ? { $or: [{ name: new RegExp(escapedSearch, 'i') }, { code: new RegExp(escapedSearch, 'i') }] } : {}),
  };
  const [items, total] = await Promise.all([
    CustomerModel.find(filter)
      .sort({ name: 1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .exec(),
    CustomerModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
