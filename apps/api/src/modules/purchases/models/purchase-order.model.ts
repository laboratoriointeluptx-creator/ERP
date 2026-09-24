import { Schema, model, type InferSchemaType } from 'mongoose';

const purchaseOrderLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    receivedQuantity: { type: String, required: true, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    unitPrice: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
  },
  { _id: false },
);

const purchaseOrderSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    purchaseRequestId: { type: Schema.Types.ObjectId, ref: 'PurchaseRequest' },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    status: { type: String, required: true, enum: ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'], default: 'DRAFT' },
    lines: { type: [purchaseOrderLineSchema], required: true, validate: [(lines: unknown[]) => lines.length > 0, 'At least one line is required'] },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true, collection: 'purchase_orders' },
);

purchaseOrderSchema.index({ organizationId: 1, code: 1 }, { unique: true });
purchaseOrderSchema.index({ organizationId: 1, supplierId: 1, status: 1, createdAt: -1 });

export type PurchaseOrder = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrderModel = model<PurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
