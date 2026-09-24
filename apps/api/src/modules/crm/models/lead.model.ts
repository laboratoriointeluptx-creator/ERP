import { Schema, model, type InferSchemaType } from 'mongoose';

const leadSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 40 },
    source: { type: String, trim: true, maxlength: 80 },
    stage: { type: String, required: true, enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED'], default: 'NEW' },
    priority: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    estimatedValue: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'leads' },
);

leadSchema.index({ organizationId: 1, stage: 1, createdAt: -1 });
leadSchema.index({ organizationId: 1, email: 1 });

export type Lead = InferSchemaType<typeof leadSchema>;
export const LeadModel = model<Lead>('Lead', leadSchema);
