import { Schema, model, type InferSchemaType } from 'mongoose';

const purchaseRequestLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const purchaseRequestSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    status: { type: String, required: true, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'DRAFT' },
    submittedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 1000 },
    lines: { type: [purchaseRequestLineSchema], required: true, validate: [(lines: unknown[]) => lines.length > 0, 'At least one line is required'] },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true, collection: 'purchase_requests' },
);

purchaseRequestSchema.index({ organizationId: 1, code: 1 }, { unique: true });
purchaseRequestSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export type PurchaseRequest = InferSchemaType<typeof purchaseRequestSchema>;
export const PurchaseRequestModel = model<PurchaseRequest>('PurchaseRequest', purchaseRequestSchema);
