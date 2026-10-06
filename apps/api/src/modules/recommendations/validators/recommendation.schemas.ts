import { z } from 'zod';

export const recommendationTrainingSchema = z.object({
  dataSource: z.string().min(1).max(100),
  features: z.array(z.string().max(100)).optional(),
  targetVariable: z.string().max(100).optional(),
  trainStartDate: z.coerce.date().optional(),
  trainEndDate: z.coerce.date().optional(),
  validationSplit: z.coerce.number().min(0).max(0.5).default(0.2),
});

export const recommendationDeploymentSchema = z.object({
  isActive: z.boolean().default(false),
  endpoint: z.string().max(500).optional(),
  batchSize: z.coerce.number().int().min(1).default(100),
  refreshFrequency: z.enum(['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
});

export const createRecommendationSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional(),
  type: z.enum(['PURCHASE', 'INVENTORY_OPTIMIZATION', 'PRICING', 'CROSS_SELL', 'UPSELL', 'CHURN_PREVENTION', 'CUSTOMER_SEGMENTATION', 'DEMAND_FORECASTING', 'SUPPLIER_SELECTION', 'CUSTOM']),
  algorithm: z.enum(['COLLABORATIVE_FILTERING', 'CONTENT_BASED', 'HYBRID', 'MATRIX_FACTORIZATION', 'DEEP_LEARNING', 'ASSOCIATION_RULES', 'CLUSTERING', 'RULE_BASED', 'CUSTOM']),
  target: z.object({
    entityType: z.string().min(1).max(50),
    entityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    audience: z.enum(['ALL_CUSTOMERS', 'SEGMENT', 'INDIVIDUAL', 'PRODUCTS', 'SUPPLIERS']),
    segmentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    filters: z.unknown().optional(),
  }),
  training: recommendationTrainingSchema,
  deployment: recommendationDeploymentSchema.optional(),
  isActive: z.boolean().default(true),
});

export const recommendationMetricsSchema = z.object({
  precision: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
  recall: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
  f1Score: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
  ndcg: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
  coverage: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
});

export const updateRecommendationSchema = createRecommendationSchema.partial().omit({ target: true, algorithm: true }).extend({
  status: z.enum(['DRAFT', 'TRAINING', 'TRAINED', 'DEPLOYED', 'ARCHIVED', 'FAILED']).optional(),
  training: recommendationTrainingSchema.partial().extend({
    dataSource: recommendationTrainingSchema.shape.dataSource.nullable().optional(),
    features: z.array(z.string().max(100)).nullable().optional(),
    targetVariable: z.string().max(100).nullable().optional(),
    trainStartDate: z.coerce.date().nullable().optional(),
    trainEndDate: z.coerce.date().nullable().optional(),
    trainedAt: z.coerce.date().nullable().optional(),
    trainingDurationMs: z.number().nullable().optional(),
    metrics: recommendationMetricsSchema.optional(),
  }).optional(),
});

export const recommendationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['PURCHASE', 'INVENTORY_OPTIMIZATION', 'PRICING', 'CROSS_SELL', 'UPSELL', 'CHURN_PREVENTION', 'CUSTOMER_SEGMENTATION', 'DEMAND_FORECASTING', 'SUPPLIER_SELECTION', 'CUSTOM']).optional(),
  algorithm: z.enum(['COLLABORATIVE_FILTERING', 'CONTENT_BASED', 'HYBRID', 'MATRIX_FACTORIZATION', 'DEEP_LEARNING', 'ASSOCIATION_RULES', 'CLUSTERING', 'RULE_BASED', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'TRAINING', 'TRAINED', 'DEPLOYED', 'ARCHIVED', 'FAILED']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(160).optional(),
});

export const recommendationFeedbackSchema = z.object({
  targetId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  action: z.enum(['CLICKED', 'PURCHASED', 'DISMISSED', 'RATED', 'SAVED']),
  rating: z.coerce.number().min(1).max(5).optional(),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>;
export type UpdateRecommendationInput = z.infer<typeof updateRecommendationSchema>;
export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
export type RecommendationFeedbackInput = z.infer<typeof recommendationFeedbackSchema>;