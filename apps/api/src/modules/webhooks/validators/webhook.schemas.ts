import { z } from 'zod';

export const createWebhookSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  url: z.string().url().max(500),
  secret: z.string().min(1).max(200),
  events: z.array(z.string().min(1).max(100)).min(1),
  isActive: z.boolean().default(true),
  headers: z.record(z.string()).optional(),
  retryPolicy: z.object({
    maxRetries: z.coerce.number().int().min(0).default(3),
    retryDelaySeconds: z.coerce.number().int().min(0).default(30),
    backoffMultiplier: z.coerce.number().min(1).default(2),
    maxRetryDelaySeconds: z.coerce.number().int().min(0).default(3600),
  }).optional(),
  timeoutSeconds: z.coerce.number().int().min(5).max(300).default(30),
  contentType: z.enum(['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']).default('application/json'),
  signatureHeader: z.string().max(50).default('X-Webhook-Signature'),
  filter: z.object({
    organizationIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    modules: z.array(z.string().max(50)).optional(),
    eventTypes: z.array(z.string().max(50)).optional(),
  }).optional(),
});

export const updateWebhookSchema = createWebhookSchema.partial();

export const webhookQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type WebhookQuery = z.infer<typeof webhookQuerySchema>;