import { SupplierModel, type Supplier } from '../models/supplier.model.js';
import type { CreateSupplierInput, SupplierQuery } from '../validators/supplier.schemas.js';

export const createSupplier = (organizationId: string, input: CreateSupplierInput): Promise<Supplier> =>
  SupplierModel.create({ organizationId, ...input });

export const listSuppliers = async (
  organizationId: string,
  query: SupplierQuery,
): Promise<{ items: Supplier[]; total: number }> => {
  const escapedSearch = query.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    organizationId,
    active: true,
    ...(escapedSearch ? { $or: [{ name: new RegExp(escapedSearch, 'i') }, { code: new RegExp(escapedSearch, 'i') }] } : {}),
  };
  const [items, total] = await Promise.all([
    SupplierModel.find(filter).sort({ name: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    SupplierModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
