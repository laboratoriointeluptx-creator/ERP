import { z } from 'zod';

export const apQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  supplierId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  hasOverdue: z.coerce.boolean().optional(),
  minBalance: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  maxBalance: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  search: z.string().max(160).optional(),
});

export const apAgingReportSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  asOfDate: z.coerce.date().default(() => new Date()),
  supplierId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export type APQuery = z.infer<typeof apQuerySchema>;
export type APAgingReportInput = z.infer<typeof apAgingReportSchema>;