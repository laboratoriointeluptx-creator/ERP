import { z } from 'zod';

export const createKpiSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional(),
  formula: z.string().min(1).max(1000),
  unit: z.string().max(20).optional(),
  target: z.string().regex(/^-?\d+(\.\d{1,4})?$/).optional(),
  warningThreshold: z.string().regex(/^-?\d+(\.\d{1,4})?$/).optional(),
  criticalThreshold: z.string().regex(/^-?\d+(\.\d{1,4})?$/).optional(),
  frequency: z.enum(['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  dataSource: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
});

export const updateKpiSchema = createKpiSchema.partial();

export const kpiQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  isActive: z.coerce.boolean().optional(),
  frequency: z.enum(['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  search: z.string().max(160).optional(),
});

export const analyticsEventQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  eventName: z.string().max(100).optional(),
  eventCategory: z.string().max(50).optional(),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(100).optional(),
});

export type CreateKpiInput = z.infer<typeof createKpiSchema>;
export type UpdateKpiInput = z.infer<typeof updateKpiSchema>;
export type KpiQuery = z.infer<typeof kpiQuerySchema>;
export type AnalyticsEventQuery = z.infer<typeof analyticsEventQuerySchema>;