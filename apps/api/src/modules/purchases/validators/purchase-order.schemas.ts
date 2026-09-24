import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const decimal = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Value must be a decimal string').refine((value) => value !== '0', 'Value must be greater than zero');

export const createPurchaseOrderSchema = z.object({
  code: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  supplierId: objectId,
  purchaseRequestId: objectId.optional(),
  lines: z.array(z.object({ productId: objectId, quantity: decimal, unitPrice: decimal }).strict()).min(1),
  currency: z.string().trim().length(3).toUpperCase().default('MXN'),
  notes: z.string().trim().max(2000).optional(),
}).strict().superRefine((value, context) => {
  const productIds = value.lines.map((line) => line.productId);
  if (new Set(productIds).size !== productIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['lines'], message: 'A product can appear only once per purchase order' });
  }
});

export const receivePurchaseOrderParamsSchema = z.object({
  id: objectId,
});

export const receivePurchaseOrderSchema = z.object({
  warehouseId: objectId,
  lines: z.array(z.object({ productId: objectId, quantity: decimal }).strict()).min(1),
}).strict().superRefine((value, context) => {
  const productIds = value.lines.map((line) => line.productId);
  if (new Set(productIds).size !== productIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['lines'], message: 'A product can appear only once per receipt' });
  }
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
