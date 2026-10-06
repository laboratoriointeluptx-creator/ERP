import { z } from 'zod';

export const bomLineSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
  unitId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  scrapFactor: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  operationSequence: z.coerce.number().int().positive().default(10),
  isPhantom: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export const createBomSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional(),
  version: z.string().max(20).default('1.0'),
  status: z.enum(['DRAFT', 'ACTIVE', 'OBSOLETE']).default('DRAFT'),
  type: z.enum(['MANUFACTURING', 'ENGINEERING', 'SERVICE']).default('MANUFACTURING'),
  lines: z.array(bomLineSchema).optional(),
  effectiveFrom: z.coerce.date().default(() => new Date()),
  effectiveTo: z.coerce.date().optional(),
  yield: z.string().regex(/^\d+(\.\d{1,4})?$/).default('1'),
  routingId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export const updateBomSchema = createBomSchema.partial().omit({ productId: true });

export const bomQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OBSOLETE']).optional(),
  type: z.enum(['MANUFACTURING', 'ENGINEERING', 'SERVICE']).optional(),
  search: z.string().max(160).optional(),
});

export type CreateBomInput = z.infer<typeof createBomSchema>;
export type UpdateBomInput = z.infer<typeof updateBomSchema>;
export type BomQuery = z.infer<typeof bomQuerySchema>;
export type BomLineInput = z.infer<typeof bomLineSchema>;