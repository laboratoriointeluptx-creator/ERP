import type { ClientSession } from 'mongoose';
import { CustomerModel, type Customer } from '../models/customer.model.js';
import type { CreateCustomerInput, CustomerQuery, UpdateCustomerInput } from '../validators/customer.schemas.js';

export const createCustomer = (organizationId: string, input: CreateCustomerInput): Promise<Customer> =>
  CustomerModel.create({ organizationId, ...input });

export const findCustomer = (organizationId: string, id: string, session?: ClientSession) => CustomerModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();
export const updateCustomer = (organizationId: string, id: string, input: UpdateCustomerInput, session?: ClientSession) =>
  CustomerModel.updateOne({ _id: id, organizationId }, { $set: input }, { runValidators: true, ...(session ? { session } : {}) }).exec();

export const listCustomers = async (
  organizationId: string,
  query: CustomerQuery,
): Promise<{ items: Customer[]; total: number }> => {
  const escapedSearch = query.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    organizationId,
    active: query.active ?? true,
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
