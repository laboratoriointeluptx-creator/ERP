import { Schema, model, type InferSchemaType } from 'mongoose';

const cycleCountLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    expectedQuantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    reservedQuantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    countedQuantity: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    variance: { type: String, match: /^-?\d+(\.\d{1,4})?$/ },
  },
  { _id: false },
);

const inventoryCycleCountSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    status: { type: String, required: true, enum: ['DRAFT', 'COMPLETED'], default: 'DRAFT' },
    reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
    lines: { type: [cycleCountLineSchema], required: true, default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: 'inventory_cycle_counts' },
);

inventoryCycleCountSchema.index({ organizationId: 1, createdAt: -1 });
inventoryCycleCountSchema.index({ organizationId: 1, warehouseId: 1, status: 1, createdAt: -1 });

export type InventoryCycleCount = InferSchemaType<typeof inventoryCycleCountSchema>;
export const InventoryCycleCountModel = model<InventoryCycleCount>('InventoryCycleCount', inventoryCycleCountSchema);
