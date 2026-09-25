import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const decimal = z.string().regex(/^\d+(\.\d{1,4})?$/).refine((value) => Number(value) > 0, 'Amount must be greater than zero');

export const issueInvoiceSchema = z.object({ salesOrderId: objectId, number: z.string().trim().min(1).max(40) }).strict();
export const createPaymentSchema = z.object({
  invoiceId: objectId,
  amount: decimal,
  method: z.enum(['CASH', 'TRANSFER', 'CARD', 'OTHER']),
  reference: z.string().trim().max(120).optional(),
}).strict();
export const financeParamsSchema = z.object({ id: objectId });
export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
