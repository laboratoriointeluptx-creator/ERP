import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createWarehouseSchema = z.object({
  code: z.string().trim().min(1).max(32).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(160),
  branchId: objectId.optional(),
}).strict();

export const warehouseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(160).optional(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});
export const updateWarehouseSchema = createWarehouseSchema.partial().extend({ active: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0);

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type WarehouseQuery = z.infer<typeof warehouseQuerySchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
