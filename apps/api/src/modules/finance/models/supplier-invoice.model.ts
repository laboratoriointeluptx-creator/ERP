import { Schema, model, type InferSchemaType } from 'mongoose';

const supplierInvoiceSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  number: { type: String, required: true, trim: true, uppercase: true, maxlength: 60 },
  amount: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  status: { type: String, required: true, enum: ['OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'], default: 'OPEN' },
}, { timestamps: true, collection: 'supplier_invoices' });

supplierInvoiceSchema.index({ organizationId: 1, supplierId: 1, number: 1 }, { unique: true });
supplierInvoiceSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
supplierInvoiceSchema.index({ organizationId: 1, purchaseOrderId: 1 });

export type SupplierInvoice = InferSchemaType<typeof supplierInvoiceSchema>;
export const SupplierInvoiceModel = model<SupplierInvoice>('SupplierInvoice', supplierInvoiceSchema);
