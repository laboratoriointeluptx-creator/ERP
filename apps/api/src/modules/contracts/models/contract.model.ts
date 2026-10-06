import { Schema, model, type InferSchemaType } from 'mongoose';

const contractSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    type: { type: String, enum: ['SALES', 'PURCHASE', 'SERVICE', 'EMPLOYMENT', 'LEASE', 'PARTNERSHIP', 'NDA', 'OTHER'], default: 'OTHER' },
    status: { type: String, enum: ['DRAFT', 'NEGOTIATING', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED'], default: 'DRAFT' },
    partyA: {
      name: { type: String, required: true, trim: true, maxlength: 200 },
      taxId: { type: String, trim: true, maxlength: 30 },
      address: { type: String, trim: true, maxlength: 500 },
      contactName: { type: String, trim: true, maxlength: 120 },
      contactEmail: { type: String, trim: true, maxlength: 160 },
    },
    partyB: {
      name: { type: String, required: true, trim: true, maxlength: 200 },
      taxId: { type: String, trim: true, maxlength: 30 },
      address: { type: String, trim: true, maxlength: 500 },
      contactName: { type: String, trim: true, maxlength: 120 },
      contactEmail: { type: String, trim: true, maxlength: 160 },
    },
    effectiveDate: { type: Date, required: true },
    expirationDate: { type: Date },
    autoRenew: { type: Boolean, default: false },
    renewalPeriod: { type: String, trim: true, maxlength: 50 },
    value: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    billingFrequency: { type: String, enum: ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'], default: 'ONE_TIME' },
    documentIds: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
    attachments: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }],
    termsAndConditions: { type: String, trim: true, maxlength: 10000 },
    signedByA: { type: Schema.Types.ObjectId, ref: 'User' },
    signedAtA: { type: Date },
    signedByB: { type: Schema.Types.ObjectId, ref: 'User' },
    signedAtB: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true, collection: 'contracts' },
);

contractSchema.index({ organizationId: 1, code: 1 }, { unique: true });
contractSchema.index({ organizationId: 1, status: 1, effectiveDate: 1 });
contractSchema.index({ organizationId: 1, expirationDate: 1 });
contractSchema.index({ organizationId: 1, type: 1 });

export type Contract = InferSchemaType<typeof contractSchema>;
export const ContractModel = model<Contract>('Contract', contractSchema);