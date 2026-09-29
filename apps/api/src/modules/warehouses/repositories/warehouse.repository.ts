import type { ClientSession } from 'mongoose';
import { WarehouseModel, type Warehouse } from '../models/warehouse.model.js';
import type { CreateWarehouseInput, WarehouseQuery, UpdateWarehouseInput } from '../validators/warehouse.schemas.js';

export const createWarehouse = (organizationId: string, input: CreateWarehouseInput): Promise<Warehouse> =>
  WarehouseModel.create({ organizationId, ...input });
export const findWarehouse = (organizationId: string, id: string, session?: ClientSession) => WarehouseModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();
export const updateWarehouse = (organizationId: string, id: string, input: UpdateWarehouseInput, session?: ClientSession) =>
  WarehouseModel.updateOne({ _id: id, organizationId }, { $set: input }, { runValidators: true, ...(session ? { session } : {}) }).exec();

export const listWarehouses = async (organizationId: string, query: WarehouseQuery): Promise<{ items: Warehouse[]; total: number }> => {
  const escapedSearch = query.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    organizationId,
    active: query.active ?? true,
    ...(escapedSearch ? { $or: [{ code: new RegExp(escapedSearch, 'i') }, { name: new RegExp(escapedSearch, 'i') }] } : {}),
  };
  const [items, total] = await Promise.all([
    WarehouseModel.find(filter).sort({ name: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    WarehouseModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
