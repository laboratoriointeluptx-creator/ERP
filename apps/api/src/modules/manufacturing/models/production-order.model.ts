import { Schema, model, type InferSchemaType } from 'mongoose';

const productionOrderSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    bomId: { type: Schema.Types.ObjectId, ref: 'Bom', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    number: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    status: { type: String, required: true, enum: ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'DRAFT' },
    plannedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: 'production_orders' },
);

productionOrderSchema.index({ organizationId: 1, number: 1 }, { unique: true });
productionOrderSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export type ProductionOrder = InferSchemaType<typeof productionOrderSchema>;
export const ProductionOrderModel = model<ProductionOrder>('ProductionOrder', productionOrderSchema);
