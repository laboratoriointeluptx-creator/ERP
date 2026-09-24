import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const quantity = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Quantity must be a decimal string').refine((value) => value !== '0', 'Quantity must be greater than zero');

export const movementSchema = z.object({
  warehouseId: objectId,
  productId: objectId,
  type: z.enum(['PURCHASE', 'SALE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'PRODUCTION', 'CONSUMPTION', 'DAMAGE']),
  quantity,
  referenceType: z.string().trim().max(80).optional(),
  referenceId: z.string().trim().max(80).optional(),
}).strict();

export type MovementInput = z.infer<typeof movementSchema>;
