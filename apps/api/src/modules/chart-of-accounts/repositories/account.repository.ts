import { AccountModel } from '../models/account.model.js';
import type { AccountQuery, CreateAccountInput, UpdateAccountInput } from '../validators/account.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createAccount = (organizationId: string, input: CreateAccountInput, session?: ClientSession) =>
  AccountModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findAccount = (organizationId: string, id: string, session?: ClientSession) =>
  AccountModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findAccountByCode = (organizationId: string, code: string, session?: ClientSession) =>
  AccountModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listAccounts = async (organizationId: string, query: AccountQuery) => {
  const filter: FilterQuery<typeof AccountModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.parentId) filter.parentId = query.parentId;
  if (query.allowPosting !== undefined) filter.allowPosting = query.allowPosting;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    AccountModel.find(filter).sort({ code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    AccountModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateAccount = (organizationId: string, id: string, input: UpdateAccountInput, session?: ClientSession) =>
  AccountModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteAccount = (organizationId: string, id: string, session?: ClientSession) =>
  AccountModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const getChildren = (organizationId: string, parentId: string, session?: ClientSession) =>
  AccountModel.find({ organizationId, parentId }).sort({ code: 1 }).session(session ?? null).exec();

export const getAccountTree = async (organizationId: string) => {
  const accounts = await AccountModel.find({ organizationId, isActive: true }).sort({ code: 1 }).lean().exec();
  const map = new Map<string, typeof accounts[0] & { children: typeof accounts }>();
  accounts.forEach((a) => map.set(String(a._id), { ...a, children: [] }));
  const roots: typeof accounts = [];
  accounts.forEach((a) => {
    const entry = map.get(String(a._id))!;
    if (a.parentId) {
      map.get(String(a.parentId))?.children.push(entry);
    } else {
      roots.push(entry);
    }
  });
  return roots;
};

export const adjustBalance = (organizationId: string, id: string, amount: string, isDebit: boolean, session?: ClientSession) => {
  const account = AccountModel.findOne({ _id: id, organizationId }).session(session ?? null);
  // Implementation would use $inc with proper decimal handling
  return AccountModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $inc: { balance: isDebit ? amount : `-${amount}` } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();
};




