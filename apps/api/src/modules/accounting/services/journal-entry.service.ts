import { HttpError } from '../../../shared/http.js';
import { areEqual, addDecimal } from '../../../shared/decimal.js';
import { JournalEntryModel } from '../models/journal-entry.model.js';
import type { CreateJournalEntryInput } from '../validators/journal-entry.schemas.js';

export const registerJournalEntry = async (organizationId: string, userId: string, input: CreateJournalEntryInput) => {
  const debitTotal = input.lines.reduce((total, line) => addDecimal(total, line.debit), '0');
  const creditTotal = input.lines.reduce((total, line) => addDecimal(total, line.credit), '0');
  if (!areEqual(debitTotal, creditTotal) || debitTotal === '0') {
    throw new HttpError(422, 'UNBALANCED_JOURNAL_ENTRY', 'Debits and credits must balance and be greater than zero');
  }

  try {
    return await JournalEntryModel.create({ organizationId, postedBy: userId, status: 'POSTED', ...input });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'JOURNAL_ENTRY_EXISTS', 'Journal entry number already exists');
    }
    throw error;
  }
};
