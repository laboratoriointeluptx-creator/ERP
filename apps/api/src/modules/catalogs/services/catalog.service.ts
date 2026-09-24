import { HttpError } from '../../../shared/http.js';
import { createCategory, createUnit, listCategories, listUnits } from '../repositories/catalog.repository.js';
import type { CatalogQuery, CreateCategoryInput, CreateUnitInput } from '../validators/catalog.schemas.js';

const duplicateError = (error: unknown, code: string, message: string): never => {
  if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
    throw new HttpError(409, code, message);
  }
  throw error;
};

export const registerCategory = async (organizationId: string, input: CreateCategoryInput) => {
  try { return await createCategory(organizationId, input); } catch (error: unknown) { return duplicateError(error, 'CATEGORY_CODE_EXISTS', 'Category code already exists'); }
};
export const registerUnit = async (organizationId: string, input: CreateUnitInput) => {
  try { return await createUnit(organizationId, input); } catch (error: unknown) { return duplicateError(error, 'UNIT_CODE_EXISTS', 'Unit code already exists'); }
};
export const getCategories = (organizationId: string, query: CatalogQuery) => listCategories(organizationId, query);
export const getUnits = (organizationId: string, query: CatalogQuery) => listUnits(organizationId, query);
