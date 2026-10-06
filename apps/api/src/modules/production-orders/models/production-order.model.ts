import { Schema, model, type InferSchemaType } from 'mongoose';

const productionOrderLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    producedQuantity: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    scrapQuantity: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    workCenterId: { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
    operationSequence: { type: Number, default: 10 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL'], default: 'PENDING' },
  },
  { _id: false },
);

const materialConsumptionSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    plannedQuantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    consumedQuantity: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    lotId: { type: Schema.Types.ObjectId, ref: 'Lot' },
    serialNumberId: { type: Schema.Types.ObjectId, ref: 'SerialNumber' },
    status: { type: String, enum: ['PENDING', 'PARTIAL', 'COMPLETED'], default: 'PENDING' },
  },
  { _id: false },
);

const productionOrderSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    bomId: { type: Schema.Types.ObjectId, ref: 'BillOfMaterials' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    plannedQuantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    producedQuantity: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    scrapQuantity: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    status: { type: String, enum: ['PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'], default: 'PLANNED' },
    priority: { type: Number, default: 50, min: 1, max: 100 },
    scheduledStartDate: { type: Date },
    scheduledEndDate: { type: Date },
    actualStartDate: { type: Date },
    actualEndDate: { type: Date },
    lines: { type: [productionOrderLineSchema], default: [] },
    materialConsumptions: { type: [materialConsumptionSchema], default: [] },
    notes: { type: String, trim: true, maxlength: 1000 },
    referenceType: { type: String, trim: true, maxlength: 80 },
    referenceId: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true, collection: 'production_orders' },
);

productionOrderSchema.index({ organizationId: 1, code: 1 }, { unique: true });
productionOrderSchema.index({ organizationId: 1, status: 1, scheduledStartDate: 1 });
productionOrderSchema.index({ organizationId: 1, productId: 1, status: 1 });
productionOrderSchema.index({ organizationId: 1, bomId: 1 });

export type ProductionOrderLine = InferSchemaType<typeof productionOrderLineSchema>;
export type MaterialConsumption = InferSchemaType<typeof materialConsumptionSchema>;
export type ProductionOrder = InferSchemaType<typeof productionOrderSchema>;
export const ProductionOrderModel = model<ProductionOrder>('ProductionOrder', productionOrderSchema);