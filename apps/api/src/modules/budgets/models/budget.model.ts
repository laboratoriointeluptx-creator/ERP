import { Schema, model, type InferSchemaType } from 'mongoose';

const budgetLineSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    period: { type: String, required: true, maxlength: 7 }, // YYYY-MM
    budgetedAmount: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    actualAmount: { type: String, default: '0', match: /^-?\d+(\.\d{1,4})?$/ },
    variance: { type: String, default: '0', match: /^-?\d+(\.\d{1,4})?$/ },
  },
  { _id: false },
);

const budgetSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500 },
    fiscalYear: { type: Number, required: true, min: 2020, max: 2099 },
    status: { type: String, enum: ['DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED'], default: 'DRAFT' },
    lines: { type: [budgetLineSchema], default: [] },
    totalBudgeted: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    totalActual: { type: String, default: '0', match: /^-?\d+(\.\d{1,4})?$/ },
    totalVariance: { type: String, default: '0', match: /^-?\d+(\.\d{1,4})?$/ },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true, collection: 'budgets' },
);

budgetSchema.index({ organizationId: 1, code: 1 }, { unique: true });
budgetSchema.index({ organizationId: 1, fiscalYear: 1, status: 1 });
budgetSchema.index({ organizationId: 1, 'lines.accountId': 1, 'lines.period': 1 });

export type BudgetLine = InferSchemaType<typeof budgetLineSchema>;
export type Budget = InferSchemaType<typeof budgetSchema>;
export const BudgetModel = model<Budget>('Budget', budgetSchema);