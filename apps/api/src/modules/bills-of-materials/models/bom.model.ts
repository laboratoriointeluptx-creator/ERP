import { Schema, model, type InferSchemaType } from 'mongoose';

const bomLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit' },
    scrapFactor: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    operationSequence: { type: Number, default: 10, min: 1 },
    isPhantom: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const bomSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500 },
    version: { type: String, required: true, trim: true, maxlength: 20, default: '1.0' },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'OBSOLETE'], default: 'DRAFT' },
    type: { type: String, enum: ['MANUFACTURING', 'ENGINEERING', 'SERVICE'], default: 'MANUFACTURING' },
    lines: { type: [bomLineSchema], default: [] },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    effectiveTo: { type: Date },
    yield: { type: String, default: '1', match: /^\d+(\.\d{1,4})?$/ },
    routingId: { type: Schema.Types.ObjectId, ref: 'Routing' },
  },
  { timestamps: true, collection: 'bills_of_materials' },
);

bomSchema.index({ organizationId: 1, productId: 1, version: 1 }, { unique: true });
bomSchema.index({ organizationId: 1, code: 1 }, { unique: true });
bomSchema.index({ organizationId: 1, status: 1, effectiveFrom: 1 });
bomSchema.index({ organizationId: 1, productId: 1, status: 1 });

export type BomLine = InferSchemaType<typeof bomLineSchema>;
export type BillOfMaterials = InferSchemaType<typeof bomSchema>;
export const BomModel = model<BillOfMaterials>('BillOfMaterials', bomSchema);