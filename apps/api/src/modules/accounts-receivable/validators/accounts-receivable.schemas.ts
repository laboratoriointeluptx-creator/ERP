import { z } from 'zod';

export const arQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  hasOverdue: z.coerce.boolean().optional(),
  minBalance: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  maxBalance: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  search: z.string().max(160).optional(),
});

export const agingReportSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  asOfDate: z.coerce.date().default(() => new Date()),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export type ARQuery = z.infer<typeof arQuerySchema>;
export type AgingReportInput = z.infer<typeof agingReportSchema>;