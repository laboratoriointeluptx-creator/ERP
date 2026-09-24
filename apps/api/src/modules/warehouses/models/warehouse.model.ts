import { Schema, model, type InferSchemaType } from 'mongoose';

const warehouseSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'warehouses' },
);

warehouseSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export type Warehouse = InferSchemaType<typeof warehouseSchema>;
export const WarehouseModel = model<Warehouse>('Warehouse', warehouseSchema);
