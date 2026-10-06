import { BudgetModel } from '../models/budget.model.js';
import type { BudgetQuery, CreateBudgetInput, UpdateBudgetInput, BudgetLineInput } from '../validators/budget.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createBudget = (organizationId: string, input: CreateBudgetInput, session?: ClientSession) => {
  const totalBudgeted = input.lines?.reduce((sum, l) => sum + Number(l.budgetedAmount), 0) ?? 0;
  return BudgetModel.create([{ ...input, organizationId, totalBudgeted: totalBudgeted.toFixed(4) }], sessionOpt(session)).then((d) => d[0]);
};

export const findBudget = (organizationId: string, id: string, session?: ClientSession) =>
  BudgetModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findBudgetByCode = (organizationId: string, code: string, session?: ClientSession) =>
  BudgetModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listBudgets = async (organizationId: string, query: BudgetQuery) => {
  const filter: FilterQuery<typeof BudgetModel> = { organizationId };
  if (query.fiscalYear) filter.fiscalYear = query.fiscalYear;
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    BudgetModel.find(filter).sort({ fiscalYear: -1, code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    BudgetModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateBudget = (organizationId: string, id: string, input: UpdateBudgetInput, session?: ClientSession) => {
  const update: Record<string, unknown> = { $set: input };
  if (input.lines) {
    const totalBudgeted = input.lines.reduce((sum, l) => sum + Number(l.budgetedAmount), 0);
    update.$set = { ...input, totalBudgeted: totalBudgeted.toFixed(4) };
  }
  return BudgetModel.findOneAndUpdate({ _id: id, organizationId }, update, { new: true, runValidators: true, session: session ?? null }).exec()
};

export const deleteBudget = (organizationId: string, id: string, session?: ClientSession) =>
  BudgetModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const approveBudget = (organizationId: string, id: string, approvedBy: string, session?: ClientSession) =>
  BudgetModel.findOneAndUpdate(
    { _id: id, organizationId, status: 'DRAFT' },
    { $set: { status: 'APPROVED', approvedBy, approvedAt: new Date() } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const activateBudget = (organizationId: string, id: string, session?: ClientSession) =>
  BudgetModel.findOneAndUpdate(
    { _id: id, organizationId, status: 'APPROVED' },
    { $set: { status: 'ACTIVE' } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const closeBudget = (organizationId: string, id: string, session?: ClientSession) =>
  BudgetModel.findOneAndUpdate(
    { _id: id, organizationId, status: 'ACTIVE' },
    { $set: { status: 'CLOSED' } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const updateActualAmount = (organizationId: string, budgetId: string, accountId: string, period: string, amount: string, session?: ClientSession) =>
  BudgetModel.findOneAndUpdate(
    { _id: budgetId, organizationId, 'lines.accountId': accountId, 'lines.period': period },
    {
      $inc: { 'lines.$.actualAmount': amount },
      $set: { 'lines.$.variance': { $subtract: ['$lines.$.budgetedAmount', { $add: ['$lines.$.actualAmount', amount] }] } },
    },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();




