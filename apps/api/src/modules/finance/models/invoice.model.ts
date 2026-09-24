import { Schema, model, type InferSchemaType } from 'mongoose';

const invoiceLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    unitPrice: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    taxCode: { type: String, trim: true, maxlength: 40 },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    salesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder' },
    number: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    status: { type: String, required: true, enum: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'], default: 'DRAFT' },
    lines: { type: [invoiceLineSchema], required: true, validate: [(lines: unknown[]) => lines.length > 0, 'At least one line is required'] },
    subtotal: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    taxTotal: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    total: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
  },
  { timestamps: true, collection: 'invoices' },
);

invoiceSchema.index({ organizationId: 1, number: 1 }, { unique: true });
invoiceSchema.index({ organizationId: 1, customerId: 1, status: 1, createdAt: -1 });

export type Invoice = InferSchemaType<typeof invoiceSchema>;
export const InvoiceModel = model<Invoice>('Invoice', invoiceSchema);
