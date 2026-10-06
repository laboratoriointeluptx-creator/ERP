import { z } from 'zod';

export const createExternalServiceSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  type: z.enum(['SAT', 'BANK', 'PAYMENT_GATEWAY', 'SHIPPING_CARRIER', 'EMAIL_PROVIDER', 'SMS_PROVIDER', 'STORAGE', 'AI_SERVICE', 'OTHER']),
  provider: z.string().min(1).max(50),
  baseUrl: z.string().max(500).optional(),
  authType: z.enum(['NONE', 'API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH', 'OAUTH2', 'CERTIFICATE', 'CUSTOM']).default('NONE'),
  credentials: z.object({
    apiKey: z.string().max(200).optional(),
    apiSecret: z.string().max(200).optional(),
    clientId: z.string().max(200).optional(),
    clientSecret: z.string().max(200).optional(),
    username: z.string().max(100).optional(),
    password: z.string().max(200).optional(),
    certificate: z.string().max(5000).optional(),
    privateKey: z.string().max(5000).optional(),
    custom: z.unknown().optional(),
  }).optional(),
  endpoints: z.array(z.object({
    name: z.string().min(1).max(100),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    path: z.string().min(1).max(500),
    headers: z.record(z.string()).optional(),
    requestSchema: z.unknown().optional(),
    responseSchema: z.unknown().optional(),
    timeoutMs: z.coerce.number().int().min(1000).default(30000),
    retryPolicy: z.object({
      maxRetries: z.coerce.number().int().min(0).default(3),
      retryDelayMs: z.coerce.number().int().min(0).default(1000),
      retryOnStatusCodes: z.array(z.coerce.number().int()).optional(),
    }).optional(),
  })).optional(),
  rateLimit: z.object({
    requestsPerSecond: z.coerce.number().int().min(1).default(10),
    requestsPerMinute: z.coerce.number().int().min(1).default(100),
    burstLimit: z.coerce.number().int().min(1).default(20),
  }).optional(),
  healthCheck: z.object({
    enabled: z.boolean().default(true),
    endpoint: z.string().max(500).optional(),
    intervalSeconds: z.coerce.number().int().min(30).default(300),
    timeoutSeconds: z.coerce.number().int().min(1).default(10),
    expectedStatus: z.coerce.number().int().default(200),
  }).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const updateExternalServiceSchema = createExternalServiceSchema.partial();

export const externalServiceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['SAT', 'BANK', 'PAYMENT_GATEWAY', 'SHIPPING_CARRIER', 'EMAIL_PROVIDER', 'SMS_PROVIDER', 'STORAGE', 'AI_SERVICE', 'OTHER']).optional(),
  provider: z.string().max(50).optional(),
  isActive: z.coerce.boolean().optional(),
  isDefault: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
});

export type CreateExternalServiceInput = z.infer<typeof createExternalServiceSchema>;
export type UpdateExternalServiceInput = z.infer<typeof updateExternalServiceSchema>;
export type ExternalServiceQuery = z.infer<typeof externalServiceQuerySchema>;