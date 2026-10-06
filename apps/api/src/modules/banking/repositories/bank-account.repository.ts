import { BankAccountModel } from '../models/bank-account.model.js';
import type { BankAccountQuery, CreateBankAccountInput, UpdateBankAccountInput, ReconciliationInput } from '../validators/bank-account.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createBankAccount = (organizationId: string, input: CreateBankAccountInput, session?: ClientSession) =>
  BankAccountModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findBankAccount = (organizationId: string, id: string, session?: ClientSession) =>
  BankAccountModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findBankAccountByCode = (organizationId: string, code: string, session?: ClientSession) =>
  BankAccountModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listBankAccounts = async (organizationId: string, query: BankAccountQuery) => {
  const filter: FilterQuery<typeof BankAccountModel> = { organizationId };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.type) filter.type = query.type;
  if (query.currency) filter.currency = query.currency;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }, { bankName: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    BankAccountModel.find(filter).sort({ code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    BankAccountModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateBankAccount = (organizationId: string, id: string, input: UpdateBankAccountInput, session?: ClientSession) =>
  BankAccountModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteBankAccount = (organizationId: string, id: string, session?: ClientSession) =>
  BankAccountModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const updateBalance = (organizationId: string, id: string, amount: string, isDeposit: boolean, session?: ClientSession) =>
  BankAccountModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $inc: { currentBalance: isDeposit ? amount : `-${amount}`, availableBalance: isDeposit ? amount : `-${amount}` } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const setReconciliationDate = (organizationId: string, id: string, date: Date, session?: ClientSession) =>
  BankAccountModel.findOneAndUpdate({ _id: id, organizationId }, { $set: { lastReconciliationDate: date } }, { new: true, runValidators: true, session: session ?? null }).exec()




