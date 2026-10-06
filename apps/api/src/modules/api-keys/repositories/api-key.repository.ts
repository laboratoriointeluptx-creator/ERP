import { ApiKeyModel } from '../models/api-key.model.js';
import type { ApiKeyQuery, CreateApiKeyInput, UpdateApiKeyInput } from '../validators/api-key.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});
import { createHash } from 'crypto';

export const generateApiKey = (prefix: string) => {
  const randomBytes = createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex');
  return `${prefix}_${randomBytes.substring(0, 32)}`;
};

export const hashApiKey = (key: string) => createHash('sha256').update(key).digest('hex');

export const createApiKey = async (organizationId: string, input: CreateApiKeyInput, session?: ClientSession) => {
  const key = generateApiKey(input.keyPrefix);
  const keyHash = hashApiKey(key);
  const created = (await ApiKeyModel.create([{ ...input, organizationId, keyHash }], sessionOpt(session)))[0];
  if (!created) throw new Error('API key creation returned no result');
  return { ...created.toObject(), key };
};

export const findApiKey = (organizationId: string, id: string, session?: ClientSession) =>
  ApiKeyModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findApiKeyByPrefix = (organizationId: string, prefix: string, session?: ClientSession) =>
  ApiKeyModel.findOne({ organizationId, keyPrefix: prefix }).session(session ?? null).exec();

export const findApiKeyByHash = (keyHash: string, session?: ClientSession) =>
  ApiKeyModel.findOne({ keyHash }).session(session ?? null).exec();

export const listApiKeys = async (organizationId: string, query: ApiKeyQuery) => {
  const filter: FilterQuery<typeof ApiKeyModel> = { organizationId };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    ApiKeyModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    ApiKeyModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateApiKey = (organizationId: string, id: string, input: UpdateApiKeyInput, session?: ClientSession) =>
  ApiKeyModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const revokeApiKey = (organizationId: string, id: string, revokedBy: string, reason: string, session?: ClientSession) =>
  ApiKeyModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $set: { isActive: false, revokedAt: new Date(), revokedBy, revocationReason: reason } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const recordApiKeyUsage = (organizationId: string, id: string, ip: string, session?: ClientSession) =>
  ApiKeyModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date(), lastUsedIp: ip } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();




