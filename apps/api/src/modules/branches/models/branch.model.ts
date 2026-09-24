import { Schema, model, type InferSchemaType } from 'mongoose';

const branchSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    timezone: { type: String, required: true, default: 'UTC' },
    address: { type: String, trim: true, maxlength: 500 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'branches' },
);

branchSchema.index({ organizationId: 1, code: 1 }, { unique: true });
branchSchema.index({ organizationId: 1, active: 1, name: 1 });

export type Branch = InferSchemaType<typeof branchSchema>;
export const BranchModel = model<Branch>('Branch', branchSchema);
