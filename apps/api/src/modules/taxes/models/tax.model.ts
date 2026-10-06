import { Schema, model, type InferSchemaType } from 'mongoose';

const taxSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    rate: { type: String, required: true, match: /^\d+(\.\d{1,6})?$/ },
    type: { type: String, enum: ['IVA', 'IEPS', 'RETENCION_ISR', 'RETENCION_IVA', 'OTRO'], required: true },
    appliesTo: { type: String, enum: ['SALE', 'PURCHASE', 'BOTH'], default: 'BOTH' },
    isActive: { type: Boolean, required: true, default: true },
    isRetention: { type: Boolean, default: false },
    satCode: { type: String, trim: true, uppercase: true, maxlength: 10 },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    effectiveTo: { type: Date },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    retentionAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  },
  { timestamps: true, collection: 'taxes' },
);

taxSchema.index({ organizationId: 1, code: 1 }, { unique: true });
taxSchema.index({ organizationId: 1, type: 1, isActive: 1 });
taxSchema.index({ organizationId: 1, appliesTo: 1, isActive: 1 });
taxSchema.index({ organizationId: 1, effectiveFrom: 1, effectiveTo: 1 });

export type Tax = InferSchemaType<typeof taxSchema>;
export const TaxModel = model<Tax>('Tax', taxSchema);