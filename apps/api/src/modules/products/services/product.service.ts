import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createProduct, findProduct, listProducts, updateProduct } from '../repositories/product.repository.js';
import type { CreateProductInput, ProductQuery, UpdateProductInput } from '../validators/product.schemas.js';

export const registerProduct = async (organizationId: string, input: CreateProductInput) => {
  try {
    return await createProduct(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'PRODUCT_SKU_EXISTS', 'Product SKU already exists');
    }
    throw error;
  }
};

export const getProducts = (organizationId: string, query: ProductQuery) => listProducts(organizationId, query);

export const modifyProduct = async (organizationId: string, actorId: string, id: string, input: UpdateProductInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findProduct(organizationId, id, session);
      if (!before) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      const update = await updateProduct(organizationId, id, input, session);
      if (update.matchedCount !== 1) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      const after = await findProduct(organizationId, id, session);
      if (!after) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      await recordAuditEvent({ organizationId, userId: actorId, action: input.active === undefined ? 'product.updated' : input.active ? 'product.activated' : 'product.deactivated', module: 'products', entity: 'Product', entityId: id, ...(ip ? { ip } : {}), before: before.toObject(), after: after.toObject() }, session);
      result = after;
    });
    if (!result) throw new Error('Product update transaction returned no result');
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) throw new HttpError(409, 'PRODUCT_SKU_EXISTS', 'Product SKU already exists');
    throw error;
  } finally { await session.endSession(); }
};
