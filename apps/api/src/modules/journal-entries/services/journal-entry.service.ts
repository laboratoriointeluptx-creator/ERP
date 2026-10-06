import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { addDecimal, areEqual, subtractDecimal } from '../../../shared/decimal.js';
import { createJournalEntry, findJournalEntry, findJournalEntryByNumber, listJournalEntries, updateJournalEntry, postJournalEntry, reverseJournalEntry, voidJournalEntry } from '../repositories/journal-entry.repository.js';
import { AccountModel } from '../../chart-of-accounts/models/account.model.js';
import type { CreateJournalEntryInput, JournalEntryQuery, UpdateJournalEntryInput, PostJournalEntryInput } from '../validators/journal-entry.schemas.js';

export const registerJournalEntry = async (organizationId: string, input: CreateJournalEntryInput) => {
  if (input.referenceType && input.referenceId) {
    const existing = await findJournalEntryByNumber(organizationId, input.journalCode, input.number);
    if (existing) throw new HttpError(409, 'JOURNAL_ENTRY_EXISTS', 'Journal entry with this number already exists');
  }
  return createJournalEntry(organizationId, input);
};

export const getJournalEntries = (organizationId: string, query: JournalEntryQuery) => listJournalEntries(organizationId, query);

export const modifyJournalEntry = async (organizationId: string, actorId: string, id: string, input: UpdateJournalEntryInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findJournalEntry(organizationId, id, session);
      if (!before) throw new HttpError(404, 'JOURNAL_ENTRY_NOT_FOUND', 'Journal entry not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft entries can be modified');
      const updated = await updateJournalEntry(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'JOURNAL_ENTRY_NOT_FOUND', 'Journal entry not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'journal-entry.updated',
        module: 'journal-entries',
        entity: 'JournalEntry',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Journal entry update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const postEntry = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findJournalEntry(organizationId, id, session);
      if (!before) throw new HttpError(404, 'JOURNAL_ENTRY_NOT_FOUND', 'Journal entry not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft entries can be posted');
      if (before.totalDebit !== before.totalCredit) throw new HttpError(400, 'UNBALANCED', 'Entry is not balanced');

      for (const line of before.lines) {
        const account = await AccountModel.findOne({ _id: line.accountId, organizationId }).session(session).exec();
        if (!account) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', `Account ${line.accountId} not found`);
        if (!account.allowPosting) throw new HttpError(409, 'POSTING_NOT_ALLOWED', `Account ${account.code} does not allow posting`);
      }

      const updated = await postJournalEntry(organizationId, id, actorId, session);
      if (!updated) throw new HttpError(404, 'JOURNAL_ENTRY_NOT_FOUND', 'Journal entry not found');

      for (const line of before.lines) {
        if (Number(line.debitAmount) > 0) {
          await AccountModel.findOneAndUpdate(
            { _id: line.accountId, organizationId },
            { $inc: { balance: line.debitAmount } },
            { session, new: true },
          ).exec();
        }
        if (Number(line.creditAmount) > 0) {
          await AccountModel.findOneAndUpdate(
            { _id: line.accountId, organizationId },
            { $inc: { balance: `-${line.creditAmount}` } },
            { session, new: true },
          ).exec();
        }
      }

      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'journal-entry.posted',
        module: 'journal-entries',
        entity: 'JournalEntry',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Journal entry post transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const reverseEntry = async (organizationId: string, actorId: string, id: string, input: PostJournalEntryInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findJournalEntry(organizationId, id, session);
      if (!before) throw new HttpError(404, 'JOURNAL_ENTRY_NOT_FOUND', 'Journal entry not found');
      if (before.status !== 'POSTED') throw new HttpError(409, 'NOT_POSTED', 'Only posted entries can be reversed');

      const reversalNumber = `REV-${before.number}`;
      const reversal = await createJournalEntry(organizationId, {
        journalCode: before.journalCode,
        number: reversalNumber,
        date: new Date(),
        description: `Reversión de ${before.journalCode}-${before.number}: ${input.reversalReason ?? 'Sin motivo'}`,
        referenceType: 'JOURNAL_ENTRY_REVERSAL',
        referenceId: before._id.toString(),
        lines: before.lines.map((l) => ({
          accountId: String(l.accountId),
          description: l.description ?? undefined,
          debitAmount: l.creditAmount,
          creditAmount: l.debitAmount,
          taxId: String(l.taxId ?? ''),
          taxBase: l.taxBase ?? undefined,
          taxAmount: l.taxAmount ?? undefined,
          costCenterId: String(l.costCenterId ?? ''),
          projectId: String(l.projectId ?? ''),
        })),
        currency: before.currency,
        exchangeRate: before.exchangeRate,
        periodId: String(before.periodId ?? ''),
      }, session);

      for (const line of before.lines) {
        if (Number(line.debitAmount) > 0) {
          await AccountModel.findOneAndUpdate(
            { _id: line.accountId, organizationId },
            { $inc: { balance: `-${line.debitAmount}` } },
            { session, new: true },
          ).exec();
        }
        if (Number(line.creditAmount) > 0) {
          await AccountModel.findOneAndUpdate(
            { _id: line.accountId, organizationId },
            { $inc: { balance: line.creditAmount } },
            { session, new: true },
          ).exec();
        }
      }

      if (!reversal) throw new Error('Reversal journal entry creation returned no result');
      const reversed = await reverseJournalEntry(organizationId, id, reversal._id.toString(), input.reversalReason ?? '', session);
      if (!reversed) throw new HttpError(404, 'JOURNAL_ENTRY_NOT_FOUND', 'Journal entry not found');

      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'journal-entry.reversed',
        module: 'journal-entries',
        entity: 'JournalEntry',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: reversed.toObject(),
      }, session);
      result = { original: reversed, reversal };
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const voidEntry = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findJournalEntry(organizationId, id, session);
      if (!before) throw new HttpError(404, 'JOURNAL_ENTRY_NOT_FOUND', 'Journal entry not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft entries can be voided');
      const voided = await voidJournalEntry(organizationId, id, session);
      if (!voided) throw new HttpError(404, 'JOURNAL_ENTRY_NOT_FOUND', 'Journal entry not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'journal-entry.voided',
        module: 'journal-entries',
        entity: 'JournalEntry',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: voided.toObject(),
      }, session);
      result = voided;
    });
    return result;
  } finally {
    await session.endSession();
  }
};