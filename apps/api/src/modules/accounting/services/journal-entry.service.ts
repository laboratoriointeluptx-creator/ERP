import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { areEqual, addDecimal } from '../../../shared/decimal.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { AccountModel } from '../models/account.model.js';
import { JournalEntryModel } from '../models/journal-entry.model.js';
import type { CreateJournalEntryInput } from '../validators/journal-entry.schemas.js';

export const registerJournalEntry = async (
  organizationId: string,
  userId: string,
  input: CreateJournalEntryInput,
  ip?: string,
) => {
  const debitTotal = input.lines.reduce((total, line) => addDecimal(total, line.debit), '0');
  const creditTotal = input.lines.reduce((total, line) => addDecimal(total, line.credit), '0');
  if (!areEqual(debitTotal, creditTotal) || debitTotal === '0') {
    throw new HttpError(422, 'UNBALANCED_JOURNAL_ENTRY', 'Debits and credits must balance and be greater than zero');
  }

  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const accountIds = [...new Set(input.lines.map((line) => line.accountId))];
      const accounts = await AccountModel.find({
        organizationId,
        active: true,
        _id: { $in: accountIds },
      }).select('_id').session(session).exec();
      if (accounts.length !== accountIds.length) {
        throw new HttpError(422, 'INVALID_JOURNAL_ACCOUNT', 'Every journal line must use an active account in this organization');
      }

      const [entry] = await JournalEntryModel.create([{
        organizationId,
        postedBy: userId,
        status: 'POSTED',
        ...input,
      }], { session });
      if (!entry) throw new Error('Journal entry creation returned no document');

      await recordAuditEvent({
        organizationId,
        userId,
        action: 'journal-entry.posted',
        module: 'accounting',
        entity: 'JournalEntry',
        entityId: String(entry._id),
        ...(ip ? { ip } : {}),
        after: {
          number: entry.number,
          date: entry.date.toISOString(),
          currency: entry.currency,
          debitTotal,
          creditTotal,
          lineCount: entry.lines.length,
        },
      }, session);
      result = entry;
    });
    return result;
  } catch (error: unknown) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'JOURNAL_ENTRY_EXISTS', 'Journal entry number already exists');
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
