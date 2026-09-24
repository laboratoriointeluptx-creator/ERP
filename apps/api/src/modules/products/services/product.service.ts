import { HttpError } from '../../../shared/http.js';
import { createProduct, listProducts } from '../repositories/product.repository.js';
import type { CreateProductInput, ProductQuery } from '../validators/product.schemas.js';

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
