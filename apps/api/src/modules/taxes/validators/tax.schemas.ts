import { z } from 'zod';

export const createTaxSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  rate: z.string().regex(/^\d+(\.\d{1,6})?$/),
  type: z.enum(['IVA', 'IEPS', 'RETENCION_ISR', 'RETENCION_IVA', 'OTRO']),
  appliesTo: z.enum(['SALE', 'PURCHASE', 'BOTH']).default('BOTH'),
  isActive: z.boolean().default(true),
  isRetention: z.boolean().default(false),
  satCode: z.string().max(10).toUpperCase().optional(),
  effectiveFrom: z.coerce.date().default(() => new Date()),
  effectiveTo: z.coerce.date().optional(),
  accountId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  retentionAccountId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export const updateTaxSchema = createTaxSchema.partial();

export const taxQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['IVA', 'IEPS', 'RETENCION_ISR', 'RETENCION_IVA', 'OTRO']).optional(),
  appliesTo: z.enum(['SALE', 'PURCHASE', 'BOTH']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
});

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
export type TaxQuery = z.infer<typeof taxQuerySchema>;