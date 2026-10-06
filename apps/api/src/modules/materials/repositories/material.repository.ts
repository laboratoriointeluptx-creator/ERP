import { MaterialModel } from '../models/material.model.js';
import type { MaterialQuery } from '../validators/material.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const findMaterial = (organizationId: string, id: string, session?: ClientSession) =>
  MaterialModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const listMaterials = async (organizationId: string, query: MaterialQuery) => {
  const filter: FilterQuery<typeof MaterialModel> = { organizationId };
  if (query.productId) filter.productId = query.productId;
  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.status) filter.status = query.status;
  if (query.productionOrderId) filter.productionOrderId = query.productionOrderId;
  if (query.search) filter.$or = [];

  const [items, total] = await Promise.all([
    MaterialModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    MaterialModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateMaterialStatus = (organizationId: string, id: string, status: string, session?: ClientSession) =>
  MaterialModel.findOneAndUpdate({ _id: id, organizationId }, { $set: { status } }, { new: true, runValidators: true, session: session ?? null }).exec()

export const allocateMaterial = (organizationId: string, id: string, quantity: string, productionOrderId: string, session?: ClientSession) =>
  MaterialModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $inc: { reservedQuantity: quantity }, $set: { status: 'ALLOCATED', productionOrderId } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();


