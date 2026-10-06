import { z } from 'zod';

export const notificationTemplateVariablesSchema = z.array(z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'OBJECT']),
}));

export const createNotificationSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  type: z.enum(['EMAIL', 'PUSH', 'SMS', 'IN_APP', 'WEBHOOK', 'SLACK', 'TEAMS']),
  channel: z.enum(['EMAIL', 'PUSH', 'SMS', 'IN_APP', 'WEBHOOK']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  trigger: z.object({
    event: z.string().min(1).max(100),
    module: z.string().min(1).max(50),
    conditions: z.unknown().optional(),
  }),
  template: z.object({
    subject: z.string().max(200).optional(),
    body: z.string().min(1).max(10000),
    variables: notificationTemplateVariablesSchema.optional(),
  }),
  recipients: z.object({
    userIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    roleIds: z.array(z.string().max(50)).optional(),
    emails: z.array(z.string().email().max(160)).optional(),
    phones: z.array(z.string().max(30)).optional(),
  }),
  scheduling: z.object({
    sendImmediately: z.boolean().default(true),
    delayMinutes: z.coerce.number().int().min(0).default(0),
    timezone: z.string().max(50).default('UTC'),
    businessHoursOnly: z.boolean().default(false),
    cronExpression: z.string().max(100).optional(),
  }).optional(),
  delivery: z.object({
    provider: z.string().max(50).optional(),
    providerConfig: z.unknown().optional(),
    retryPolicy: z.object({
      maxRetries: z.coerce.number().int().min(0).default(3),
      retryDelayMinutes: z.coerce.number().int().min(0).default(5),
      backoffMultiplier: z.coerce.number().min(1).default(2),
    }).optional(),
  }).optional(),
  tracking: z.object({
    openTracking: z.boolean().default(true),
    clickTracking: z.boolean().default(true),
    unsubscribeLink: z.boolean().default(true),
  }).optional(),
});

export const updateNotificationSchema = createNotificationSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['EMAIL', 'PUSH', 'SMS', 'IN_APP', 'WEBHOOK', 'SLACK', 'TEAMS']).optional(),
  channel: z.enum(['EMAIL', 'PUSH', 'SMS', 'IN_APP', 'WEBHOOK']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  search: z.string().max(160).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;