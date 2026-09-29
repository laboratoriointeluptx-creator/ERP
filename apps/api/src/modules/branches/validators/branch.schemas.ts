import { z } from 'zod';

export const createBranchSchema = z.object({
  code: z.string().trim().min(1).max(32).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(160),
  timezone: z.string().trim().min(1).max(80).default('UTC'),
  address: z.string().trim().max(500).optional(),
}).strict();

export const branchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(160).optional(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});
export const updateBranchSchema = createBranchSchema.partial().extend({ active: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0);

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type BranchQuery = z.infer<typeof branchQuerySchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
