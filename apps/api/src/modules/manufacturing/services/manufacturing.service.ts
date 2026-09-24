import { HttpError } from '../../../shared/http.js';
import { createBom, createProductionOrder } from '../repositories/manufacturing.repository.js';
import type { CreateBomInput, CreateProductionOrderInput } from '../validators/manufacturing.schemas.js';

const duplicate = (error: unknown, code: string, message: string): never => {
  if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
    throw new HttpError(409, code, message);
  }
  throw error;
};

export const registerBom = async (organizationId: string, input: CreateBomInput) => {
  try { return await createBom(organizationId, input); } catch (error: unknown) { return duplicate(error, 'BOM_EXISTS', 'BOM already exists'); }
};

export const registerProductionOrder = async (organizationId: string, input: CreateProductionOrderInput) => {
  try { return await createProductionOrder(organizationId, input); } catch (error: unknown) { return duplicate(error, 'PRODUCTION_ORDER_EXISTS', 'Production order already exists'); }
};
