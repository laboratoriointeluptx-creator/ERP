import { Schema, model, type InferSchemaType } from 'mongoose';

const creditMemoLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    unitPrice: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    amount: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
  },
  { _id: false },
);

const creditMemoSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    inventoryReturnId: { type: Schema.Types.ObjectId, ref: 'InventoryReturn', required: true },
    number: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
    lines: { type: [creditMemoLineSchema], required: true, validate: [(lines: unknown[]) => lines.length > 0, 'At least one line is required'] },
    subtotal: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    taxTotal: { type: String, required: true, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    total: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'credit_memos' },
);

creditMemoSchema.index({ organizationId: 1, number: 1 }, { unique: true });
creditMemoSchema.index({ organizationId: 1, inventoryReturnId: 1 }, { unique: true });
creditMemoSchema.index({ organizationId: 1, invoiceId: 1, createdAt: -1 });

export type CreditMemo = InferSchemaType<typeof creditMemoSchema>;
export const CreditMemoModel = model<CreditMemo>('CreditMemo', creditMemoSchema);
