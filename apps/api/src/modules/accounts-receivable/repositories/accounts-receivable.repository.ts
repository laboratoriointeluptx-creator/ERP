import { AccountsReceivableModel } from '../models/accounts-receivable.model.js';
import type { ARQuery, AgingReportInput } from '../validators/accounts-receivable.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const findAR = (organizationId: string, customerId: string, session?: ClientSession) =>
  AccountsReceivableModel.findOne({ organizationId, customerId }).session(session ?? null).exec();

export const listAR = async (organizationId: string, query: ARQuery) => {
  const filter: FilterQuery<typeof AccountsReceivableModel> = { organizationId };
  if (query.customerId) filter.customerId = query.customerId;
  if (query.hasOverdue) filter.overdueBalance = { $gt: '0' };
  if (query.minBalance) filter.currentBalance = { $gte: query.minBalance };
  if (query.maxBalance) filter.currentBalance = { ...(filter.currentBalance as object), $lte: query.maxBalance };
  if (query.search) filter.$or = [];

  const [items, total] = await Promise.all([
    AccountsReceivableModel.find(filter).sort({ currentBalance: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    AccountsReceivableModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateARBalance = (organizationId: string, customerId: string, amount: string, isDebit: boolean, session?: ClientSession) =>
  AccountsReceivableModel.findOneAndUpdate(
    { organizationId, customerId },
    { $inc: { currentBalance: isDebit ? amount : `-${amount}` } },
    { new: true, runValidators: true, upsert: true, session: session ?? null },
  ).exec();

export const addARLine = (organizationId: string, customerId: string, line: unknown, session?: ClientSession) =>
  AccountsReceivableModel.findOneAndUpdate(
    { organizationId, customerId },
    { $push: { lines: line } },
    { new: true, runValidators: true, upsert: true, session: session ?? null },
  ).exec();

export const getAgingReport = async (organizationId: string, input: AgingReportInput) => {
  const asOf = input.asOfDate;
  const match: FilterQuery<typeof AccountsReceivableModel> = { organizationId };
  if (input.customerId) match.customerId = input.customerId;

  return AccountsReceivableModel.aggregate([
    { $match: match },
    {
      $project: {
        customerId: 1,
        currentBalance: 1,
        overdueBalance: 1,
        creditLimit: 1,
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
        customerId: 1,
        currentBalance: 1,
        overdueBalance: 1,
        creditLimit: 1,
        currency: 1,
        current: { $sum: { $cond: [{ $lte: ['$lines.dueDate', asOf] }, '$lines.creditAmount', 0] } },
        days1_30: { $sum: { $cond: [{ $and: [{ $gt: ['$lines.dueDate', asOf] }, { $lte: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 30 } }] }] }, '$lines.creditAmount', 0] } },
        days31_60: { $sum: { $cond: [{ $and: [{ $gt: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 30 } }] }, { $lte: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 60 } }] }] }, '$lines.creditAmount', 0] } },
        days61_90: { $sum: { $cond: [{ $and: [{ $gt: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 60 } }] }, { $lte: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 90 } }] }] }, '$lines.creditAmount', 0] } },
        days91_plus: { $sum: { $cond: [{ $gt: ['$lines.dueDate', { $dateAdd: { startDate: asOf, unit: 'day', amount: 90 } }] }, '$lines.creditAmount', 0] } },
      },
    },
  ]).exec();
};

