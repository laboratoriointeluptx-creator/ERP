import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const quantity = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Quantity must be a decimal string').refine((value) => value !== '0', 'Quantity must be greater than zero');

export const createBomSchema = z.object({
  code: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  finishedProductId: objectId,
  version: z.number().int().min(1).default(1),
  lines: z.array(z.object({ productId: objectId, quantity }).strict()).min(1),
}).strict();

export const createProductionOrderSchema = z.object({
  bomId: objectId,
  warehouseId: objectId,
  number: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  quantity,
  plannedAt: z.coerce.date().optional(),
}).strict();

export type CreateBomInput = z.infer<typeof createBomSchema>;
export type CreateProductionOrderInput = z.infer<typeof createProductionOrderSchema>;
