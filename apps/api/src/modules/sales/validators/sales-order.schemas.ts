import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const decimal = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Value must be a decimal string').refine((value) => value !== '0', 'Value must be greater than zero');

export const createSalesOrderSchema = z.object({
  code: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  customerId: objectId,
  lines: z.array(z.object({ productId: objectId, quantity: decimal, unitPrice: decimal }).strict()).min(1),
  currency: z.string().trim().length(3).toUpperCase().default('MXN'),
  notes: z.string().trim().max(2000).optional(),
}).strict();

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
