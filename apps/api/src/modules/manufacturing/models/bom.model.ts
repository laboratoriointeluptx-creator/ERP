import { Schema, model, type InferSchemaType } from 'mongoose';

const bomLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
  },
  { _id: false },
);

const bomSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    finishedProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    version: { type: Number, required: true, min: 1, default: 1 },
    lines: { type: [bomLineSchema], required: true, validate: [(lines: unknown[]) => lines.length > 0, 'At least one material is required'] },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'boms' },
);

bomSchema.index({ organizationId: 1, code: 1, version: 1 }, { unique: true });
bomSchema.index({ organizationId: 1, finishedProductId: 1, active: 1 });

export type Bom = InferSchemaType<typeof bomSchema>;
export const BomModel = model<Bom>('Bom', bomSchema);
