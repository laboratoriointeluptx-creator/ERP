import { Schema, model, type InferSchemaType } from 'mongoose';

const supplierPaymentSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierInvoiceId: { type: Schema.Types.ObjectId, ref: 'SupplierInvoice', required: true },
  amount: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  method: { type: String, required: true, enum: ['CASH', 'TRANSFER', 'CARD', 'OTHER'] },
  reference: { type: String, trim: true, maxlength: 120 },
  status: { type: String, required: true, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
}, { timestamps: true, collection: 'supplier_payments' });

supplierPaymentSchema.index({ organizationId: 1, supplierInvoiceId: 1, createdAt: -1 });
supplierPaymentSchema.index({ organizationId: 1, supplierId: 1, createdAt: -1 });

export type SupplierPayment = InferSchemaType<typeof supplierPaymentSchema>;
export const SupplierPaymentModel = model<SupplierPayment>('SupplierPayment', supplierPaymentSchema);
