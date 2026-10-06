import { Schema, model, type InferSchemaType } from 'mongoose';

const materialSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    lotId: { type: Schema.Types.ObjectId, ref: 'Lot' },
    serialNumberId: { type: Schema.Types.ObjectId, ref: 'SerialNumber' },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    reservedQuantity: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    unitCost: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    status: { type: String, enum: ['AVAILABLE', 'ALLOCATED', 'IN_PRODUCTION', 'QUARANTINE', 'SCRAP'], default: 'AVAILABLE' },
    productionOrderId: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
    workCenterId: { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
    expiryDate: { type: Date },
    receivedDate: { type: Date, default: Date.now },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  },
  { timestamps: true, collection: 'materials' },
);

materialSchema.index({ organizationId: 1, productId: 1, warehouseId: 1, status: 1 });
materialSchema.index({ organizationId: 1, productionOrderId: 1 });
materialSchema.index({ organizationId: 1, lotId: 1 });
materialSchema.index({ organizationId: 1, serialNumberId: 1 });
materialSchema.index({ organizationId: 1, expiryDate: 1 });

export type Material = InferSchemaType<typeof materialSchema>;
export const MaterialModel = model<Material>('Material', materialSchema);