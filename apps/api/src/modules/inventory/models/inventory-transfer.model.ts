import { Schema, model, type InferSchemaType } from 'mongoose';

const inventoryTransferSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    sourceWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    destinationWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    occurredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: 'inventory_transfers' },
);

inventoryTransferSchema.index({ organizationId: 1, occurredAt: -1 });
inventoryTransferSchema.index({ organizationId: 1, sourceWarehouseId: 1, occurredAt: -1 });
inventoryTransferSchema.index({ organizationId: 1, destinationWarehouseId: 1, occurredAt: -1 });

export type InventoryTransfer = InferSchemaType<typeof inventoryTransferSchema>;
export const InventoryTransferModel = model<InventoryTransfer>('InventoryTransfer', inventoryTransferSchema);
