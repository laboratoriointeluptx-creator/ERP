import { Schema, model, type InferSchemaType } from 'mongoose';

const deliverySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment', required: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route' },
    carrierId: { type: Schema.Types.ObjectId, ref: 'Carrier' },
    driverName: { type: String, trim: true, maxlength: 120 },
    vehiclePlate: { type: String, trim: true, maxlength: 20 },
    status: { type: String, enum: ['SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'], default: 'SCHEDULED' },
    scheduledDate: { type: Date, required: true },
    actualDate: { type: Date },
    deliveryAddress: { type: String, required: true, trim: true, maxlength: 500 },
    recipientName: { type: String, trim: true, maxlength: 120 },
    recipientPhone: { type: String, trim: true, maxlength: 30 },
    proofOfDelivery: { type: String, trim: true, maxlength: 500 },
    signature: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 1000 },
    gpsCoordinates: {
      latitude: { type: String },
      longitude: { type: String },
    },
  },
  { timestamps: true, collection: 'deliveries' },
);

deliverySchema.index({ organizationId: 1, code: 1 }, { unique: true });
deliverySchema.index({ organizationId: 1, shipmentId: 1 });
deliverySchema.index({ organizationId: 1, status: 1, scheduledDate: 1 });

export type Delivery = InferSchemaType<typeof deliverySchema>;
export const DeliveryModel = model<Delivery>('Delivery', deliverySchema);