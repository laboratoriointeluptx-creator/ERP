import { Schema, model, type InferSchemaType } from 'mongoose';

const accountSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    type: { type: String, required: true, enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] },
    parentId: { type: Schema.Types.ObjectId, ref: 'Account' },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'accounts' },
);

accountSchema.index({ organizationId: 1, code: 1 }, { unique: true });
accountSchema.index({ organizationId: 1, type: 1, active: 1 });

export type Account = InferSchemaType<typeof accountSchema>;
export const AccountModel = model<Account>('Account', accountSchema);
