import { Schema, model, type InferSchemaType } from 'mongoose';

const arLineSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    description: { type: String, trim: true, maxlength: 500 },
    debitAmount: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    creditAmount: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    creditMemoId: { type: Schema.Types.ObjectId, ref: 'CreditMemo' },
    dueDate: { type: Date },
  },
  { _id: false },
);

const accountsReceivableSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    lines: { type: [arLineSchema], default: [] },
    currentBalance: { type: String, default: '0', match: /^-?\d+(\.\d{1,4})?$/ },
    overdueBalance: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    creditLimit: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    lastStatementDate: { type: Date },
    lastPaymentDate: { type: Date },
    agingBuckets: {
      current: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
      days1_30: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
      days31_60: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
      days61_90: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
      days91_plus: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    },
  },
  { timestamps: true, collection: 'accounts_receivable' },
);

accountsReceivableSchema.index({ organizationId: 1, customerId: 1 }, { unique: true });
accountsReceivableSchema.index({ organizationId: 1, currentBalance: -1 });
accountsReceivableSchema.index({ organizationId: 1, overdueBalance: -1 });

export type AccountsReceivableLine = InferSchemaType<typeof arLineSchema>;
export type AccountsReceivable = InferSchemaType<typeof accountsReceivableSchema>;
export const AccountsReceivableModel = model<AccountsReceivable>('AccountsReceivable', accountsReceivableSchema);