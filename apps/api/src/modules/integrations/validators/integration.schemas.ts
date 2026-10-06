import { z } from 'zod';

export const createIntegrationSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  type: z.enum(['ECOMMERCE', 'MARKETPLACE', 'ACCOUNTING', 'CRM', 'ERP', 'PAYMENT', 'SHIPPING', 'TAX', 'BANKING', 'CUSTOM']),
  provider: z.string().min(1).max(50),
  version: z.string().max(20).default('1.0'),
  config: z.object({
    baseUrl: z.string().max(500).optional(),
    apiKey: z.string().max(200).optional(),
    apiSecret: z.string().max(200).optional(),
    accessToken: z.string().max(500).optional(),
    refreshToken: z.string().max(500).optional(),
    clientId: z.string().max(200).optional(),
    clientSecret: z.string().max(200).optional(),
    scopes: z.array(z.string().max(100)).optional(),
    customFields: z.unknown().optional(),
  }).optional(),
  syncSettings: z.object({
    autoSync: z.boolean().default(false),
    syncFrequency: z.enum(['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MANUAL']).default('MANUAL'),
    syncDirection: z.enum(['IMPORT', 'EXPORT', 'BIDIRECTIONAL']).default('BIDIRECTIONAL'),
    conflictResolution: z.enum(['LOCAL_WINS', 'REMOTE_WINS', 'MERGE', 'MANUAL']).default('MANUAL'),
    batchSize: z.coerce.number().int().min(1).max(1000).default(100),
  }).optional(),
  mapping: z.object({
    entities: z.array(z.object({
      localEntity: z.string().min(1).max(50),
      remoteEntity: z.string().min(1).max(50),
      fieldMappings: z.array(z.object({
        localField: z.string().min(1).max(50),
        remoteField: z.string().min(1).max(50),
        transform: z.string().max(200).optional(),
      })).optional(),
    })).optional(),
  }).optional(),
  webhookUrl: z.string().max(500).optional(),
  webhookSecret: z.string().max(200).optional(),
  healthCheckUrl: z.string().max(500).optional(),
});

export const updateIntegrationSchema = createIntegrationSchema.partial().extend({
  status: z.enum(['DRAFT', 'CONFIGURED', 'CONNECTED', 'SYNCING', 'ERROR', 'DISABLED']).optional(),
});

export const integrationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['ECOMMERCE', 'MARKETPLACE', 'ACCOUNTING', 'CRM', 'ERP', 'PAYMENT', 'SHIPPING', 'TAX', 'BANKING', 'CUSTOM']).optional(),
  provider: z.string().max(50).optional(),
  status: z.enum(['DRAFT', 'CONFIGURED', 'CONNECTED', 'SYNCING', 'ERROR', 'DISABLED']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
});

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
export type IntegrationQuery = z.infer<typeof integrationQuerySchema>;