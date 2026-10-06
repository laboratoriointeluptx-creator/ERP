import { SettingModel } from '../models/setting.model.js';
import type { SettingQuery, CreateSettingInput, UpdateSettingInput } from '../validators/setting.schemas.js';
import type { ClientSession, FilterQuery, UpdateQuery } from 'mongoose';

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createSetting = (organizationId: string, input: CreateSettingInput, session?: ClientSession) =>
  SettingModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findSetting = (organizationId: string, key: string, scope = 'organization', branchId?: string, userId?: string, session?: ClientSession) => {
  const filter: FilterQuery<typeof SettingModel> = { organizationId, key, scope };
  if (branchId) filter.branchId = branchId;
  if (userId) filter.userId = userId;
  return SettingModel.findOne(filter).session(session ?? null).exec();
};

export const listSettings = async (organizationId: string, query: SettingQuery) => {
  const filter: FilterQuery<typeof SettingModel> = { organizationId };
  if (query.scope) filter.scope = query.scope;
  if (query.branchId) filter.branchId = query.branchId;
  if (query.userId) filter.userId = query.userId;
  if (query.search) filter.key = { $regex: query.search, $options: 'i' };

  const [items, total] = await Promise.all([
    SettingModel.find(filter).sort({ key: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    SettingModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateSetting = (organizationId: string, key: string, input: UpdateSettingInput, scope = 'organization', branchId?: string, userId?: string, session?: ClientSession) => {
  const filter: FilterQuery<typeof SettingModel> = { organizationId, key, scope };
  if (branchId) filter.branchId = branchId;
  if (userId) filter.userId = userId;
  return SettingModel.findOneAndUpdate(filter, { $set: input }, {
    new: true,
    runValidators: true,
    includeResultMetadata: false,
    ...(session ? { session } : {}),
  }).exec();
};

export const deleteSetting = (organizationId: string, key: string, scope = 'organization', branchId?: string, userId?: string, session?: ClientSession) => {
  const filter: FilterQuery<typeof SettingModel> = { organizationId, key, scope };
  if (branchId) filter.branchId = branchId;
  if (userId) filter.userId = userId;
  return SettingModel.findOneAndDelete(filter).session(session ?? null).exec();
};
