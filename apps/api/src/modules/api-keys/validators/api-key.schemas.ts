import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  keyPrefix: z.string().min(1).max(20).toUpperCase(),
  scopes: z.array(z.string().min(1).max(50)).min(1),
  permissions: z.array(z.string().min(1).max(50)).min(1),
  rateLimit: z.object({
    requestsPerMinute: z.coerce.number().int().min(1).default(60),
    requestsPerHour: z.coerce.number().int().min(1).default(1000),
    requestsPerDay: z.coerce.number().int().min(1).default(10000),
  }).optional(),
  ipWhitelist: z.array(z.string().max(45)).optional(),
  ipBlacklist: z.array(z.string().max(45)).optional(),
  allowedOrigins: z.array(z.string().max(200)).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const updateApiKeySchema = createApiKeySchema.partial().omit({ keyPrefix: true });

export const apiKeyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
export type ApiKeyQuery = z.infer<typeof apiKeyQuerySchema>;