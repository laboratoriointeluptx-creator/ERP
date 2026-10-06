import { JournalEntryModel } from '../models/journal-entry.model.js';
import type { JournalEntryQuery, CreateJournalEntryInput, UpdateJournalEntryInput } from '../validators/journal-entry.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createJournalEntry = (organizationId: string, input: CreateJournalEntryInput, session?: ClientSession) =>
  JournalEntryModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findJournalEntry = (organizationId: string, id: string, session?: ClientSession) =>
  JournalEntryModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findJournalEntryByNumber = (organizationId: string, journalCode: string, number: string, session?: ClientSession) =>
  JournalEntryModel.findOne({ organizationId, journalCode, number }).session(session ?? null).exec();

export const listJournalEntries = async (organizationId: string, query: JournalEntryQuery) => {
  const filter: FilterQuery<typeof JournalEntryModel> = { organizationId };
  if (query.status) filter.status = query.status;
  if (query.journalCode) filter.journalCode = query.journalCode;
  if (query.accountId) filter['lines.accountId'] = query.accountId;
  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = query.dateFrom;
    if (query.dateTo) filter.date.$lte = query.dateTo;
  }
  if (query.periodId) filter.periodId = query.periodId;
  if (query.search) filter.$or = [{ number: { $regex: query.search, $options: 'i' } }, { description: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    JournalEntryModel.find(filter).sort({ date: -1, number: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    JournalEntryModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateJournalEntry = (organizationId: string, id: string, input: UpdateJournalEntryInput, session?: ClientSession) =>
  JournalEntryModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec();

export const postJournalEntry = (organizationId: string, id: string, postedBy: string, session?: ClientSession) =>
  JournalEntryModel.findOneAndUpdate(
    { _id: id, organizationId, status: 'DRAFT' },
    { $set: { status: 'POSTED', postedAt: new Date(), postedBy } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const reverseJournalEntry = (organizationId: string, id: string, reversedEntryId: string, reversalReason: string, session?: ClientSession) =>
  JournalEntryModel.findOneAndUpdate(
    { _id: id, organizationId, status: 'POSTED' },
    { $set: { status: 'REVERSED', reversedEntryId, reversalReason } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const voidJournalEntry = (organizationId: string, id: string, session?: ClientSession) =>
  JournalEntryModel.findOneAndUpdate(
    { _id: id, organizationId, status: 'DRAFT' },
    { $set: { status: 'VOIDED' } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const getJournalEntryTotals = (organizationId: string, filter: FilterQuery<typeof JournalEntryModel>) =>
  JournalEntryModel.aggregate([
    { $match: filter },
    { $group: { _id: null, totalDebit: { $sum: { $toDecimal: '$totalDebit' } }, totalCredit: { $sum: { $toDecimal: '$totalCredit' } }, count: { $sum: 1 } } },
  ]).exec();

