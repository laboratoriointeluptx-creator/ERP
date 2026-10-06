import { HttpError } from '../../../shared/http.js';
import { createApiKey, findApiKey, findApiKeyByPrefix, findApiKeyByHash, listApiKeys, updateApiKey, revokeApiKey, recordApiKeyUsage, hashApiKey } from '../repositories/api-key.repository.js';
import type { CreateApiKeyInput, ApiKeyQuery, UpdateApiKeyInput } from '../validators/api-key.schemas.js';

export const generateApiKey = async (organizationId: string, input: CreateApiKeyInput) => {
  try {
    return await createApiKey(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'API_KEY_PREFIX_EXISTS', 'API key prefix already exists');
    }
    throw error;
  }
};

export const getApiKeys = (organizationId: string, query: ApiKeyQuery) => listApiKeys(organizationId, query);

export const validateApiKey = async (key: string) => {
  const keyHash = hashApiKey(key);
  const apiKey = await findApiKeyByHash(keyHash);
  if (!apiKey) return null;
  if (!apiKey.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
  return apiKey;
};

export const recordUsage = async (organizationId: string, id: string, ip: string) => {
  const updated = await recordApiKeyUsage(organizationId, id, ip);
  if (!updated) throw new HttpError(404, 'API_KEY_NOT_FOUND', 'API key not found');
  return updated;
};

export const revokeKey = async (organizationId: string, id: string, revokedBy: string, reason: string) => {
  const revoked = await revokeApiKey(organizationId, id, revokedBy, reason);
  if (!revoked) throw new HttpError(404, 'API_KEY_NOT_FOUND', 'API key not found');
  return revoked;
};