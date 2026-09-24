import { Schema, model, type InferSchemaType } from 'mongoose';

const shipmentSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    salesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    number: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    carrier: { type: String, trim: true, maxlength: 120 },
    trackingNumber: { type: String, trim: true, maxlength: 120 },
    shippingAddress: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, required: true, enum: ['PENDING', 'PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'], default: 'PENDING' },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true, collection: 'shipments' },
);

shipmentSchema.index({ organizationId: 1, number: 1 }, { unique: true });
shipmentSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
shipmentSchema.index({ organizationId: 1, trackingNumber: 1 });

export type Shipment = InferSchemaType<typeof shipmentSchema>;
export const ShipmentModel = model<Shipment>('Shipment', shipmentSchema);
