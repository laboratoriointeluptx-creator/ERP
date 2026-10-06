import { Schema, model, type InferSchemaType } from 'mongoose';

const bankAccountSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    bankName: { type: String, required: true, trim: true, maxlength: 120 },
    accountNumber: { type: String, required: true, trim: true, maxlength: 50 },
    clabe: { type: String, trim: true, maxlength: 18 },
    swift: { type: String, trim: true, maxlength: 11 },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    type: { type: String, enum: ['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT'], default: 'CHECKING' },
    isActive: { type: Boolean, default: true },
    currentBalance: { type: String, default: '0', match: /^-?\d+(\.\d{1,4})?$/ },
    availableBalance: { type: String, default: '0', match: /^-?\d+(\.\d{1,4})?$/ },
    lastReconciliationDate: { type: Date },
    lastStatementDate: { type: Date },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  },
  { timestamps: true, collection: 'bank_accounts' },
);

bankAccountSchema.index({ organizationId: 1, code: 1 }, { unique: true });
bankAccountSchema.index({ organizationId: 1, accountNumber: 1 });
bankAccountSchema.index({ organizationId: 1, clabe: 1 });
bankAccountSchema.index({ organizationId: 1, isActive: 1 });

export type BankAccount = InferSchemaType<typeof bankAccountSchema>;
export const BankAccountModel = model<BankAccount>('BankAccount', bankAccountSchema);