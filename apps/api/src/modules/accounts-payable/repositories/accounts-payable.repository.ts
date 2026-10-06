import { AccountsPayableModel } from '../models/accounts-payable.model.js';
import type { APQuery, APAgingReportInput } from '../validators/accounts-payable.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const findAP = (organizationId: string, supplierId: string, session?: ClientSession) =>
  AccountsPayableModel.findOne({ organizationId, supplierId }).session(session ?? null).exec();

export const listAP = async (organizationId: string, query: APQuery) => {
  const filter: FilterQuery<typeof AccountsPayableModel> = { organizationId };
  if (query.supplierId) filter.supplierId = query.supplierId;
  if (query.hasOverdue) filter.overdueBalance = { $gt: '0' };
  if (query.minBalance) filter.currentBalance = { $gte: query.minBalance };
  if (query.maxBalance) filter.currentBalance = { ...(filter.currentBalance as object), $lte: query.maxBalance };

  const [items, total] = await Promise.all([
    AccountsPayableModel.find(filter).sort({ currentBalance: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    AccountsPayableModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateAPBalance = (organizationId: string, supplierId: string, amount: string, isCredit: boolean, session?: ClientSession) =>
  AccountsPayableModel.findOneAndUpdate(
    { organizationId, supplierId },
    { $inc: { currentBalance: isCredit ? amount : `-${amount}` } },
    { new: true, runValidators: true, upsert: true, session: session ?? null },
  ).exec();

export const addAPLine = (organizationId: string, supplierId: string, line: unknown, session?: ClientSession) =>
  AccountsPayableModel.findOneAndUpdate(
    { organizationId, supplierId },
    { $push: { lines: line } },
    { new: true, runValidators: true, upsert: true, session: session ?? null },
  ).exec();

export const getAPAgingReport = async (organizationId: string, input: APAgingReportInput) => {
  const asOf = input.asOfDate;
  const match: FilterQuery<typeof AccountsPayableModel> = { organizationId };
  if (input.supplierId) match.supplierId = input.supplierId;

  return AccountsPayableModel.aggregate([
    { $match: match },
    {
      $project: {
        supplierId: 1,
        currentBalance: 1,
        overdueBalance: 1,
        currency: 1,
        lines: {
          $filter: {
            input: '$lines',
            cond: { $lte: ['$$this.dueDate', asOf] },
          },
        },
      },
    },
    {
      $project: {
        supplierId: 1,
        currentBalance: 1,
        overdueBalance: 1,
        currency: 1,
        current: { $sum: { $cond: [{ $lte: ['$lines.dueDate', asOf] }, '$lines.debitAmount', 0] } },
        days1_30: { $sum: { $cond: [{ $and: [{ $gt: ['$lines.dueDate', asOf] }, { $lte: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 30 } }] }] }, '$lines.debitAmount', 0] } },
        days31_60: { $sum: { $cond: [{ $and: [{ $gt: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 30 } }] }, { $lte: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 60 } }] }] }, '$lines.debitAmount', 0] } },
        days61_90: { $sum: { $cond: [{ $and: [{ $gt: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 60 } }] }, { $lte: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 90 } }] }] }, '$lines.debitAmount', 0] } },
        days91_plus: { $sum: { $cond: [{ $gt: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 90 } }] }, '$lines.debitAmount', 0] } },
      },
    },
  ]).exec();
};