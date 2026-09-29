import { z } from 'zod';

export const createCategorySchema = z.object({
  code: z.string().trim().min(1).max(32).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(160),
  parentId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).strict();

export const createUnitSchema = z.object({
  code: z.string().trim().min(1).max(16).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(80),
  decimals: z.number().int().min(0).max(4).default(0),
}).strict();

export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(160).optional(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});
export const updateCategorySchema = createCategorySchema.partial().extend({ active: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0);
export const updateUnitSchema = createUnitSchema.partial().extend({ active: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
