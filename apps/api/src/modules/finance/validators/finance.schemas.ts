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
export const createSupplierInvoiceSchema = z.object({
  purchaseOrderId: objectId,
  number: z.string().trim().min(1).max(60),
  amount: decimal,
}).strict();
export const createSupplierPaymentSchema = z.object({
  supplierInvoiceId: objectId,
  amount: decimal,
  method: z.enum(['CASH', 'TRANSFER', 'CARD', 'OTHER']),
  reference: z.string().trim().max(120).optional(),
}).strict();
export const financeParamsSchema = z.object({ id: objectId });
const pagination = { page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) };
export const invoiceQuerySchema = z.object({
  ...pagination,
  status: z.enum(['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).optional(),
  customerId: objectId.optional(),
});
export const paymentQuerySchema = z.object({
  ...pagination,
  invoiceId: objectId.optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
});
export const supplierInvoiceQuerySchema = z.object({
  ...pagination,
  status: z.enum(['OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).optional(),
  supplierId: objectId.optional(),
});
export const supplierPaymentQuerySchema = z.object({
  ...pagination,
  supplierInvoiceId: objectId.optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
});
export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
export type CreateSupplierInvoiceInput = z.infer<typeof createSupplierInvoiceSchema>;
export type CreateSupplierPaymentInput = z.infer<typeof createSupplierPaymentSchema>;
export type SupplierInvoiceQuery = z.infer<typeof supplierInvoiceQuerySchema>;
export type SupplierPaymentQuery = z.infer<typeof supplierPaymentQuerySchema>;
