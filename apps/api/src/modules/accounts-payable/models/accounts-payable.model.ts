import { Schema, model, type InferSchemaType } from 'mongoose';

const apLineSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    description: { type: String, trim: true, maxlength: 500 },
    debitAmount: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    creditAmount: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    supplierInvoiceId: { type: Schema.Types.ObjectId, ref: 'SupplierInvoice' },
    supplierPaymentId: { type: Schema.Types.ObjectId, ref: 'SupplierPayment' },
    dueDate: { type: Date },
  },
  { _id: false },
);

const accountsPayableSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    lines: { type: [apLineSchema], default: [] },
    currentBalance: { type: String, default: '0', match: /^-?\d+(\.\d{1,4})?$/ },
    overdueBalance: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
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
  { timestamps: true, collection: 'accounts_payable' },
);

accountsPayableSchema.index({ organizationId: 1, supplierId: 1 }, { unique: true });
accountsPayableSchema.index({ organizationId: 1, currentBalance: -1 });
accountsPayableSchema.index({ organizationId: 1, overdueBalance: -1 });

export type AccountsPayableLine = InferSchemaType<typeof apLineSchema>;
export type AccountsPayable = InferSchemaType<typeof accountsPayableSchema>;
export const AccountsPayableModel = model<AccountsPayable>('AccountsPayable', accountsPayableSchema);