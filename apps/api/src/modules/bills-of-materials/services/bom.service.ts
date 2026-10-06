import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createBom, findBom, findBomByCode, findActiveBomForProduct, listBoms, updateBom, deleteBom } from '../repositories/bom.repository.js';
import { ProductModel } from '../../products/models/product.model.js';
import type { CreateBomInput, BomQuery, UpdateBomInput } from '../validators/bom.schemas.js';

export const registerBom = async (organizationId: string, input: CreateBomInput) => {
  const product = await ProductModel.findOne({ _id: input.productId, organizationId }).exec();
  if (!product) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

  try {
    return await createBom(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'BOM_CODE_EXISTS', 'BOM code already exists');
    }
    throw error;
  }
};

export const getBoms = (organizationId: string, query: BomQuery) => listBoms(organizationId, query);

export const getActiveBomForProduct = (organizationId: string, productId: string, date?: Date) =>
  findActiveBomForProduct(organizationId, productId, date);

export const modifyBom = async (organizationId: string, actorId: string, id: string, input: UpdateBomInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBom(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BOM_NOT_FOUND', 'BOM not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft BOMs can be modified');
      const updated = await updateBom(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'BOM_NOT_FOUND', 'BOM not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'bom.updated' : input.status === 'ACTIVE' ? 'bom.activated' : 'bom.obsoleted',
        module: 'bills-of-materials',
        entity: 'BillOfMaterials',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('BOM update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeBom = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBom(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BOM_NOT_FOUND', 'BOM not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft BOMs can be deleted');
      const deleted = await deleteBom(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'BOM_NOT_FOUND', 'BOM not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'bom.deleted',
        module: 'bills-of-materials',
        entity: 'BillOfMaterials',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: null,
      }, session);
      result = deleted;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const calculateBomCost = async (organizationId: string, bomId: string) => {
  const bom = await findBom(organizationId, bomId);
  if (!bom) throw new HttpError(404, 'BOM_NOT_FOUND', 'BOM not found');

  let totalCost = 0;
  for (const line of bom.lines) {
    const product = await ProductModel.findOne({ _id: line.productId, organizationId }).exec();
    if (product && product.standardCost) {
      const qty = Number(line.quantity) * (1 + Number(line.scrapFactor));
      totalCost += qty * Number(product.standardCost);
    }
  }
  return { bomId, totalCost: totalCost.toFixed(4), currency: 'MXN' };
};