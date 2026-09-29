import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { CategoryModel } from '../models/category.model.js';
import { createCategory, createUnit, findCategory, findUnit, listCategories, listUnits, updateCategory, updateUnit } from '../repositories/catalog.repository.js';
import type { CatalogQuery, CreateCategoryInput, CreateUnitInput, UpdateCategoryInput, UpdateUnitInput } from '../validators/catalog.schemas.js';

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

export const modifyCategory = async (organizationId: string, actorId: string, id: string, input: UpdateCategoryInput, ip?: string) => {
  if (input.parentId) {
    if (input.parentId === id) throw new HttpError(409, 'CATEGORY_PARENT_CYCLE', 'A category cannot be its own parent');
    if (!(await CategoryModel.exists({ _id: input.parentId, organizationId, active: true }))) throw new HttpError(404, 'CATEGORY_PARENT_NOT_FOUND', 'Parent category not found');
  }
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findCategory(organizationId, id, session);
      if (!before) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      if (input.active === false && await CategoryModel.exists({ organizationId, parentId: id, active: true }).session(session)) throw new HttpError(409, 'CATEGORY_HAS_ACTIVE_CHILDREN', 'Deactivate or move child categories before deactivating this category');
      const update = await updateCategory(organizationId, id, input, session);
      if (update.matchedCount !== 1) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      const after = await findCategory(organizationId, id, session);
      if (!after) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      await recordAuditEvent({ organizationId, userId: actorId, action: input.active === undefined ? 'category.updated' : input.active ? 'category.activated' : 'category.deactivated', module: 'catalogs', entity: 'Category', entityId: id, ...(ip ? { ip } : {}), before: before.toObject(), after: after.toObject() }, session);
      result = after;
    });
    if (!result) throw new Error('Category update transaction returned no result');
    return result;
  } catch (error: unknown) { return duplicateError(error, 'CATEGORY_CODE_EXISTS', 'Category code already exists'); }
  finally { await session.endSession(); }
};

export const modifyUnit = async (organizationId: string, actorId: string, id: string, input: UpdateUnitInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findUnit(organizationId, id, session);
      if (!before) throw new HttpError(404, 'UNIT_NOT_FOUND', 'Unit not found');
      const update = await updateUnit(organizationId, id, input, session);
      if (update.matchedCount !== 1) throw new HttpError(404, 'UNIT_NOT_FOUND', 'Unit not found');
      const after = await findUnit(organizationId, id, session);
      if (!after) throw new HttpError(404, 'UNIT_NOT_FOUND', 'Unit not found');
      await recordAuditEvent({ organizationId, userId: actorId, action: input.active === undefined ? 'unit.updated' : input.active ? 'unit.activated' : 'unit.deactivated', module: 'catalogs', entity: 'Unit', entityId: id, ...(ip ? { ip } : {}), before: before.toObject(), after: after.toObject() }, session);
      result = after;
    });
    if (!result) throw new Error('Unit update transaction returned no result');
    return result;
  } catch (error: unknown) { return duplicateError(error, 'UNIT_CODE_EXISTS', 'Unit code already exists'); }
  finally { await session.endSession(); }
};
