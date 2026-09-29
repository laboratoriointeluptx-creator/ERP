import type { ClientSession } from 'mongoose';
import { ProductModel, type Product } from '../models/product.model.js';
import type { CreateProductInput, ProductQuery, UpdateProductInput } from '../validators/product.schemas.js';

export const createProduct = (organizationId: string, input: CreateProductInput): Promise<Product> =>
  ProductModel.create({ organizationId, ...input });
export const findProduct = (organizationId: string, id: string, session?: ClientSession) => ProductModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();
export const updateProduct = (organizationId: string, id: string, input: UpdateProductInput, session?: ClientSession) =>
  ProductModel.updateOne({ _id: id, organizationId }, { $set: input }, { runValidators: true, ...(session ? { session } : {}) }).exec();

export const listProducts = async (organizationId: string, query: ProductQuery): Promise<{ items: Product[]; total: number }> => {
  const escapedSearch = query.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    organizationId,
    active: query.active ?? true,
    ...(escapedSearch ? { $or: [{ name: new RegExp(escapedSearch, 'i') }, { sku: new RegExp(escapedSearch, 'i') }] } : {}),
  };
  const [items, total] = await Promise.all([
    ProductModel.find(filter).sort({ name: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    ProductModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
