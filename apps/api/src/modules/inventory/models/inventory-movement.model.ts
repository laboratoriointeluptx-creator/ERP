import { Schema, model, type InferSchemaType } from 'mongoose';

const inventoryMovementSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, required: true, enum: ['PURCHASE', 'SALE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'PRODUCTION', 'CONSUMPTION', 'DAMAGE'] },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    referenceType: { type: String, trim: true, maxlength: 80 },
    referenceId: { type: String, trim: true, maxlength: 80 },
    occurredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: 'inventory_movements' },
);

inventoryMovementSchema.index({ organizationId: 1, warehouseId: 1, productId: 1, occurredAt: -1 });

export type InventoryMovement = InferSchemaType<typeof inventoryMovementSchema>;
export const InventoryMovementModel = model<InventoryMovement>('InventoryMovement', inventoryMovementSchema);
