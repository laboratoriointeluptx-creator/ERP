import { Schema, model, type InferSchemaType } from 'mongoose';

const categorySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'categories' },
);

categorySchema.index({ organizationId: 1, code: 1 }, { unique: true });
categorySchema.index({ organizationId: 1, parentId: 1, name: 1 });

export type Category = InferSchemaType<typeof categorySchema>;
export const CategoryModel = model<Category>('Category', categorySchema);
