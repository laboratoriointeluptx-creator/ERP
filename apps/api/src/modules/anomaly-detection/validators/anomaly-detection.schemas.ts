import { z } from 'zod';

export const anomalyDetectionConfigSchema = z.object({
  algorithm: z.string().min(1).max(50),
  parameters: z.unknown().optional(),
});

export const anomalyDetectionTargetSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  metricField: z.string().min(1).max(50),
  dimensions: z.array(z.string().max(50)).optional(),
  filters: z.unknown().optional(),
});

export const anomalyDetectionDetectionSchema = z.object({
  threshold: z.string().regex(/^\d+(\.\d{1,4})?$/),
  sensitivity: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  windowSize: z.coerce.number().int().min(10).default(100),
  minAnomalyGap: z.coerce.number().int().min(0).default(1),
  alertOnDetection: z.boolean().default(true),
  notificationChannels: z.array(z.enum(['EMAIL', 'PUSH', 'IN_APP', 'WEBHOOK', 'SLACK'])).optional(),
});

export const createAnomalyDetectionSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional(),
  type: z.enum(['STATISTICAL', 'ML_BASED', 'RULE_BASED', 'ISOLATION_FOREST', 'AUTOENCODER', 'CUSTOM']),
  target: anomalyDetectionTargetSchema,
  model: anomalyDetectionConfigSchema,
  detection: anomalyDetectionDetectionSchema,
  isActive: z.boolean().default(true),
  scheduleFrequency: z.enum(['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY']).default('DAILY'),
});

export const updateAnomalyDetectionSchema = createAnomalyDetectionSchema.partial();

export const anomalyDetectionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['STATISTICAL', 'ML_BASED', 'RULE_BASED', 'ISOLATION_FOREST', 'AUTOENCODER', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'TRAINING', 'TRAINED', 'MONITORING', 'ARCHIVED', 'FAILED']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(160).optional(),
});

export const acknowledgeAnomalySchema = z.object({
  acknowledgedBy: z.string().regex(/^[0-9a-fA-F]{24}$/),
  resolutionNotes: z.string().max(2000).optional(),
});

export type CreateAnomalyDetectionInput = z.infer<typeof createAnomalyDetectionSchema>;
export type UpdateAnomalyDetectionInput = z.infer<typeof updateAnomalyDetectionSchema>;
export type AnomalyDetectionQuery = z.infer<typeof anomalyDetectionQuerySchema>;
export type AcknowledgeAnomalyInput = z.infer<typeof acknowledgeAnomalySchema>;