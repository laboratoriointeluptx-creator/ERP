import { Schema, model, type InferSchemaType } from 'mongoose';

const journalLineSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    description: { type: String, trim: true, maxlength: 300 },
    debit: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    credit: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
  },
  { _id: false },
);

const journalEntrySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    number: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    date: { type: Date, required: true },
    status: { type: String, required: true, enum: ['DRAFT', 'POSTED', 'VOID'], default: 'DRAFT' },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    lines: { type: [journalLineSchema], required: true, validate: [(lines: unknown[]) => lines.length >= 2, 'At least two lines are required'] },
    sourceType: { type: String, trim: true, maxlength: 80 },
    sourceId: { type: String, trim: true, maxlength: 80 },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'journal_entries' },
);

journalEntrySchema.index({ organizationId: 1, number: 1 }, { unique: true });
journalEntrySchema.index({ organizationId: 1, date: -1, status: 1 });

export type JournalEntry = InferSchemaType<typeof journalEntrySchema>;
export const JournalEntryModel = model<JournalEntry>('JournalEntry', journalEntrySchema);
