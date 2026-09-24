import { CategoryModel, type Category } from '../models/category.model.js';
import { UnitModel, type Unit } from '../models/unit.model.js';
import type { CatalogQuery, CreateCategoryInput, CreateUnitInput } from '../validators/catalog.schemas.js';

export const createCategory = (organizationId: string, input: CreateCategoryInput): Promise<Category> => CategoryModel.create({ organizationId, ...input });
export const createUnit = (organizationId: string, input: CreateUnitInput): Promise<Unit> => UnitModel.create({ organizationId, ...input });

export const listCategories = async (organizationId: string, query: CatalogQuery) => {
  const filter = { organizationId, active: true };
  const [items, total] = await Promise.all([
    CategoryModel.find(filter).sort({ name: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    CategoryModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const listUnits = async (organizationId: string, query: CatalogQuery) => {
  const filter = { organizationId, active: true };
  const [items, total] = await Promise.all([
    UnitModel.find(filter).sort({ code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    UnitModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
