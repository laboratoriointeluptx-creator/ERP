import { Schema, model, type InferSchemaType } from 'mongoose';

const customerRefundSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    creditMemoId: { type: Schema.Types.ObjectId, ref: 'CreditMemo', required: true },
    amount: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    method: { type: String, required: true, enum: ['CASH', 'TRANSFER', 'CARD', 'OTHER'] },
    reference: { type: String, trim: true, maxlength: 120 },
    reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'customer_refunds' },
);

customerRefundSchema.index({ organizationId: 1, invoiceId: 1, createdAt: -1 });
customerRefundSchema.index({ organizationId: 1, paymentId: 1, createdAt: -1 });
customerRefundSchema.index({ organizationId: 1, creditMemoId: 1, createdAt: -1 });

export type CustomerRefund = InferSchemaType<typeof customerRefundSchema>;
export const CustomerRefundModel = model<CustomerRefund>('CustomerRefund', customerRefundSchema);
