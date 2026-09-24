import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const quantity = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Quantity must be a decimal string').refine((value) => value !== '0', 'Quantity must be greater than zero');

export const createPurchaseRequestSchema = z.object({
  code: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  lines: z.array(z.object({ productId: objectId, quantity, note: z.string().trim().max(500).optional() }).strict()).min(1),
  notes: z.string().trim().max(2000).optional(),
}).strict();

export const purchaseRequestQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
});

export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;
export type PurchaseRequestQuery = z.infer<typeof purchaseRequestQuerySchema>;
