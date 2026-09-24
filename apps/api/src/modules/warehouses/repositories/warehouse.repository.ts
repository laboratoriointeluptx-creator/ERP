import { WarehouseModel, type Warehouse } from '../models/warehouse.model.js';
import type { CreateWarehouseInput, WarehouseQuery } from '../validators/warehouse.schemas.js';

export const createWarehouse = (organizationId: string, input: CreateWarehouseInput): Promise<Warehouse> =>
  WarehouseModel.create({ organizationId, ...input });

export const listWarehouses = async (organizationId: string, query: WarehouseQuery): Promise<{ items: Warehouse[]; total: number }> => {
  const filter = { organizationId, active: true };
  const [items, total] = await Promise.all([
    WarehouseModel.find(filter).sort({ name: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    WarehouseModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
