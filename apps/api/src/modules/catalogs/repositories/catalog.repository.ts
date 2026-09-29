import type { ClientSession } from 'mongoose';
import { CategoryModel, type Category } from '../models/category.model.js';
import { UnitModel, type Unit } from '../models/unit.model.js';
import type { CatalogQuery, CreateCategoryInput, CreateUnitInput, UpdateCategoryInput, UpdateUnitInput } from '../validators/catalog.schemas.js';

export const createCategory = (organizationId: string, input: CreateCategoryInput): Promise<Category> => CategoryModel.create({ organizationId, ...input });
export const createUnit = (organizationId: string, input: CreateUnitInput): Promise<Unit> => UnitModel.create({ organizationId, ...input });
export const findCategory = (organizationId: string, id: string, session?: ClientSession) => CategoryModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();
export const updateCategory = (organizationId: string, id: string, input: UpdateCategoryInput, session?: ClientSession) =>
  CategoryModel.updateOne({ _id: id, organizationId }, { $set: input }, { runValidators: true, ...(session ? { session } : {}) }).exec();
export const findUnit = (organizationId: string, id: string, session?: ClientSession) => UnitModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();
export const updateUnit = (organizationId: string, id: string, input: UpdateUnitInput, session?: ClientSession) =>
  UnitModel.updateOne({ _id: id, organizationId }, { $set: input }, { runValidators: true, ...(session ? { session } : {}) }).exec();

export const listCategories = async (organizationId: string, query: CatalogQuery) => {
  const escapedSearch = query.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    organizationId,
    active: query.active ?? true,
    ...(escapedSearch ? { $or: [{ code: new RegExp(escapedSearch, 'i') }, { name: new RegExp(escapedSearch, 'i') }] } : {}),
  };
  const [items, total] = await Promise.all([
    CategoryModel.find(filter).sort({ name: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    CategoryModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const listUnits = async (organizationId: string, query: CatalogQuery) => {
  const escapedSearch = query.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    organizationId,
    active: query.active ?? true,
    ...(escapedSearch ? { $or: [{ code: new RegExp(escapedSearch, 'i') }, { name: new RegExp(escapedSearch, 'i') }] } : {}),
  };
  const [items, total] = await Promise.all([
    UnitModel.find(filter).sort({ code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    UnitModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
