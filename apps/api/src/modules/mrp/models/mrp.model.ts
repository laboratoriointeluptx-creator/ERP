import { Schema, model, type InferSchemaType } from 'mongoose';

const mrpResultSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    period: { type: String, required: true },
    grossRequirement: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    scheduledReceipts: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    onHand: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    netRequirement: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    plannedOrderReceipt: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    plannedOrderRelease: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    action: { type: String, enum: ['NONE', 'RELEASE', 'RESCHEDULE', 'CANCEL'], default: 'NONE' },
    messages: [{ type: String }],
  },
  { _id: false },
);

const mrpRunSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    status: { type: String, enum: ['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED'], default: 'DRAFT' },
    parameters: {
      horizonDays: { type: Number, default: 90 },
      includePlannedOrders: { type: Boolean, default: true },
      includeForecast: { type: Boolean, default: false },
      safetyStockMethod: { type: String, enum: ['FIXED', 'DAYS_OF_SUPPLY', 'STATISTICAL'], default: 'FIXED' },
    },
    results: { type: [mrpResultSchema], default: [] },
    summary: {
      totalProducts: { type: Number, default: 0 },
      actionsRequired: { type: Number, default: 0 },
      plannedOrdersGenerated: { type: Number, default: 0 },
      exceptions: { type: Number, default: 0 },
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String, maxlength: 2000 },
  },
  { timestamps: true, collection: 'mrp_runs' },
);

mrpRunSchema.index({ organizationId: 1, code: 1 }, { unique: true });
mrpRunSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export type MrpResult = InferSchemaType<typeof mrpResultSchema>;
export type MrpRun = InferSchemaType<typeof mrpRunSchema>;
export const MrpRunModel = model<MrpRun>('MrpRun', mrpRunSchema);