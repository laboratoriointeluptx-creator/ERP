import { Schema, model, type InferSchemaType } from 'mongoose';

const productSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 64 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    unit: { type: String, required: true, trim: true, uppercase: true, maxlength: 16, default: 'PZA' },
    salePrice: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'products' },
);

productSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
productSchema.index({ organizationId: 1, name: 1 });

export type Product = InferSchemaType<typeof productSchema>;
export const ProductModel = model<Product>('Product', productSchema);
