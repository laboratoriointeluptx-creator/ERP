import { Schema, model, type InferSchemaType } from 'mongoose';

const carrierSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    contactName: { type: String, trim: true, maxlength: 120 },
    email: { type: String, trim: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 30 },
    address: { type: String, trim: true, maxlength: 500 },
    taxId: { type: String, trim: true, maxlength: 30 },
    serviceLevel: { type: String, enum: ['STANDARD', 'EXPRESS', 'OVERNIGHT', 'INTERNATIONAL'], default: 'STANDARD' },
    trackingUrl: { type: String, trim: true, maxlength: 500 },
    apiEndpoint: { type: String, trim: true, maxlength: 500 },
    apiKey: { type: String, trim: true, maxlength: 200 },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true, collection: 'carriers' },
);

carrierSchema.index({ organizationId: 1, code: 1 }, { unique: true });
carrierSchema.index({ organizationId: 1, isActive: 1 });

export type Carrier = InferSchemaType<typeof carrierSchema>;
export const CarrierModel = model<Carrier>('Carrier', carrierSchema);