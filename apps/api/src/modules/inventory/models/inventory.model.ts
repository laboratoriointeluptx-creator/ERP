import { Schema, model, type InferSchemaType } from 'mongoose';

const inventorySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    reservedQuantity: { type: String, required: true, default: '0', match: /^\d+(\.\d{1,4})?$/ },
  },
  { timestamps: true, collection: 'inventory' },
);

inventorySchema.index({ organizationId: 1, warehouseId: 1, productId: 1 }, { unique: true });

export type Inventory = InferSchemaType<typeof inventorySchema>;
export const InventoryModel = model<Inventory>('Inventory', inventorySchema);
