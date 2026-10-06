import { Schema, model, type InferSchemaType } from 'mongoose';

const journalEntryLineSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    description: { type: String, trim: true, maxlength: 500 },
    debitAmount: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    creditAmount: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    taxId: { type: Schema.Types.ObjectId, ref: 'Tax' },
    taxBase: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    taxAmount: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    costCenterId: { type: Schema.Types.ObjectId },
    projectId: { type: Schema.Types.ObjectId },
  },
  { _id: false },
);

const journalEntrySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    journalCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    number: { type: String, required: true, trim: true, maxlength: 30 },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true, trim: true, minlength: 3, maxlength: 1000 },
    referenceType: { type: String, trim: true, maxlength: 80 },
    referenceId: { type: String, trim: true, maxlength: 80 },
    status: { type: String, enum: ['DRAFT', 'POSTED', 'REVERSED', 'VOIDED'], default: 'DRAFT' },
    lines: { type: [journalEntryLineSchema], required: true, validate: { validator: (v: unknown[]) => v.length >= 2, message: 'At least two lines required' } },
    totalDebit: { type: String, required: true, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    totalCredit: { type: String, required: true, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    exchangeRate: { type: String, default: '1', match: /^\d+(\.\d{1,6})?$/ },
    postedAt: { type: Date },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reversedEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    reversalReason: { type: String, trim: true, maxlength: 500 },
    periodId: { type: Schema.Types.ObjectId, ref: 'AccountingPeriod' },
  },
  { timestamps: true, collection: 'journal_entries' },
);

journalEntrySchema.index({ organizationId: 1, journalCode: 1, number: 1 }, { unique: true });
journalEntrySchema.index({ organizationId: 1, date: -1 });
journalEntrySchema.index({ organizationId: 1, status: 1, date: -1 });
journalEntrySchema.index({ organizationId: 1, periodId: 1, status: 1 });
journalEntrySchema.index({ organizationId: 1, referenceType: 1, referenceId: 1 });
journalEntrySchema.index({ 'lines.accountId': 1 });

export type JournalEntryLine = InferSchemaType<typeof journalEntryLineSchema>;
export type JournalEntry = InferSchemaType<typeof journalEntrySchema>;
export const JournalEntryModel = model<JournalEntry>('JournalEntry', journalEntrySchema);