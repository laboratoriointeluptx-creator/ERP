import { z } from 'zod';

export const materialQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'IN_PRODUCTION', 'QUARANTINE', 'SCRAP']).optional(),
  productionOrderId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(160).optional(),
});

export type MaterialQuery = z.infer<typeof materialQuerySchema>;