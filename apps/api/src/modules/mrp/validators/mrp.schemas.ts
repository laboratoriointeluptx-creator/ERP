import { z } from 'zod';

export const mrpParametersSchema = z.object({
  horizonDays: z.coerce.number().int().positive().max(365).default(90),
  includePlannedOrders: z.boolean().default(true),
  includeForecast: z.boolean().default(false),
  safetyStockMethod: z.enum(['FIXED', 'DAYS_OF_SUPPLY', 'STATISTICAL']).default('FIXED'),
});

export const createMrpRunSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  parameters: mrpParametersSchema.optional(),
});

export const mrpResultSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  period: z.string(),
  grossRequirement: z.string().optional(),
  scheduledReceipts: z.string().optional(),
  onHand: z.string().optional(),
  netRequirement: z.string().optional(),
  plannedOrderReceipt: z.string().optional(),
  plannedOrderRelease: z.string().optional(),
  action: z.enum(['NONE', 'RELEASE', 'RESCHEDULE', 'CANCEL']).optional(),
  messages: z.array(z.string()).optional(),
});

export const updateMrpRunSchema = createMrpRunSchema.partial().extend({
  status: z.enum(['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED']).optional(),
  results: z.array(mrpResultSchema).optional(),
  summary: z.object({
    totalProducts: z.number().optional(),
    actionsRequired: z.number().optional(),
    plannedOrdersGenerated: z.number().optional(),
    exceptions: z.number().optional(),
  }).optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  errorMessage: z.string().max(2000).optional(),
});

export const mrpRunQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED']).optional(),
  search: z.string().max(160).optional(),
});

export type CreateMrpRunInput = z.infer<typeof createMrpRunSchema>;
export type UpdateMrpRunInput = z.infer<typeof updateMrpRunSchema>;
export type MrpRunQuery = z.infer<typeof mrpRunQuerySchema>;
export type MrpParametersInput = z.infer<typeof mrpParametersSchema>;