import { z } from 'zod';

export const forecastParametersSchema = z.object({
  horizon: z.coerce.number().int().min(1).max(365),
  seasonality: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'AUTO']).default('AUTO'),
  confidenceLevel: z.coerce.number().min(0.5).max(0.999).default(0.95),
  includeHolidays: z.boolean().default(true),
  countryCode: z.string().length(2).default('MX'),
  externalRegressors: z.array(z.string().max(100)).optional(),
});

export const forecastDataSourceSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dateField: z.string().min(1).max(50),
  valueField: z.string().min(1).max(50),
  filters: z.unknown().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']),
});

export const createForecastSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional(),
  type: z.enum(['DEMAND', 'SALES', 'INVENTORY', 'CASHFLOW', 'PRODUCTION', 'CUSTOM']),
  model: z.enum(['ARIMA', 'PROPHET', 'LSTM', 'XGBOOST', 'LINEAR_REGRESSION', 'MOVING_AVERAGE', 'EXPONENTIAL_SMOOTHING', 'ENSEMBLE']),
  dataSource: forecastDataSourceSchema,
  parameters: forecastParametersSchema,
  isActive: z.boolean().default(true),
  scheduledFrequency: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).default('NONE'),
});

export const forecastTrainingSchema = z.object({
  trainStartDate: z.coerce.date().nullable().optional(),
  trainEndDate: z.coerce.date().nullable().optional(),
  validationSplit: z.coerce.number().min(0).max(0.5).default(0.2),
  metrics: z.object({
    mae: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
    mape: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
    rmse: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
    r2: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
  }).optional(),
  trainedAt: z.coerce.date().nullable().optional(),
  trainingDurationMs: z.number().nullable().optional(),
});

export const updateForecastSchema = createForecastSchema.partial().extend({
  status: z.enum(['DRAFT', 'TRAINING', 'TRAINED', 'DEPLOYED', 'ARCHIVED', 'FAILED']).optional(),
  training: forecastTrainingSchema.partial().optional(),
});

export const forecastQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['DEMAND', 'SALES', 'INVENTORY', 'CASHFLOW', 'PRODUCTION', 'CUSTOM']).optional(),
  model: z.enum(['ARIMA', 'PROPHET', 'LSTM', 'XGBOOST', 'LINEAR_REGRESSION', 'MOVING_AVERAGE', 'EXPONENTIAL_SMOOTHING', 'ENSEMBLE']).optional(),
  status: z.enum(['DRAFT', 'TRAINING', 'TRAINED', 'DEPLOYED', 'ARCHIVED', 'FAILED']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(160).optional(),
});

export type CreateForecastInput = z.infer<typeof createForecastSchema>;
export type UpdateForecastInput = z.infer<typeof updateForecastSchema>;
export type ForecastQuery = z.infer<typeof forecastQuerySchema>;
export type ForecastParametersInput = z.infer<typeof forecastParametersSchema>;
export type ForecastDataSourceInput = z.infer<typeof forecastDataSourceSchema>;