import { Schema, model, type InferSchemaType } from 'mongoose';

const unitSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 16 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    decimals: { type: Number, required: true, min: 0, max: 4, default: 0 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'units' },
);

unitSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export type Unit = InferSchemaType<typeof unitSchema>;
export const UnitModel = model<Unit>('Unit', unitSchema);
