import { Schema, model, type InferSchemaType } from 'mongoose';

const supplierSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 40 },
    taxId: { type: String, trim: true, uppercase: true, maxlength: 20 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'suppliers' },
);

supplierSchema.index({ organizationId: 1, code: 1 }, { unique: true });
supplierSchema.index({ organizationId: 1, name: 1 });

export type Supplier = InferSchemaType<typeof supplierSchema>;
export const SupplierModel = model<Supplier>('Supplier', supplierSchema);
