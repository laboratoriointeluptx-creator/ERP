import { Schema, model, type InferSchemaType } from 'mongoose';

const inventoryReturnLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
  },
  { _id: false },
);

const inventoryReturnSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    sourceType: { type: String, required: true, enum: ['SALE_ORDER', 'PURCHASE_ORDER'] },
    sourceDocumentId: { type: Schema.Types.ObjectId, required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
    lines: { type: [inventoryReturnLineSchema], required: true, validate: [(lines: unknown[]) => lines.length > 0, 'At least one line is required'] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    occurredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: 'inventory_returns' },
);

inventoryReturnSchema.index({ organizationId: 1, sourceType: 1, sourceDocumentId: 1, occurredAt: -1 });
inventoryReturnSchema.index({ organizationId: 1, warehouseId: 1, occurredAt: -1 });

export type InventoryReturn = InferSchemaType<typeof inventoryReturnSchema>;
export const InventoryReturnModel = model<InventoryReturn>('InventoryReturn', inventoryReturnSchema);
