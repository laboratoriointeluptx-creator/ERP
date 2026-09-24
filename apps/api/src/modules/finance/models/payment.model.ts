import { Schema, model, type InferSchemaType } from 'mongoose';

const paymentSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    amount: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    method: { type: String, required: true, enum: ['CASH', 'TRANSFER', 'CARD', 'OTHER'] },
    reference: { type: String, trim: true, maxlength: 120 },
    status: { type: String, required: true, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
  },
  { timestamps: true, collection: 'payments' },
);

paymentSchema.index({ organizationId: 1, invoiceId: 1, createdAt: -1 });

export type Payment = InferSchemaType<typeof paymentSchema>;
export const PaymentModel = model<Payment>('Payment', paymentSchema);
