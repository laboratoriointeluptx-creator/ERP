import { Schema, model, type InferSchemaType } from 'mongoose';

const accountSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], required: true },
    subType: { type: String, trim: true, maxlength: 50 },
    nature: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Account' },
    level: { type: Number, required: true, default: 1, min: 1, max: 10 },
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
    allowPosting: { type: Boolean, default: true },
    currency: { type: String, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    satCode: { type: String, trim: true, uppercase: true, maxlength: 20 },
    balance: { type: String, default: '0', match: /^-?\d+(\.\d{1,4})?$/ },
  },
  { timestamps: true, collection: 'chart_of_accounts' },
);

accountSchema.index({ organizationId: 1, code: 1 }, { unique: true });
accountSchema.index({ organizationId: 1, parentId: 1 });
accountSchema.index({ organizationId: 1, type: 1, isActive: 1 });
accountSchema.index({ organizationId: 1, level: 1 });

export type Account = InferSchemaType<typeof accountSchema>;
export const AccountModel = model<Account>('Account', accountSchema);