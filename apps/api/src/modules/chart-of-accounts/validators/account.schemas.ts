import { z } from 'zod';

export const createAccountSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional(),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  subType: z.string().max(50).optional(),
  nature: z.enum(['DEBIT', 'CREDIT']),
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  level: z.coerce.number().int().min(1).max(10).default(1),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  allowPosting: z.boolean().default(true),
  currency: z.string().length(3).toUpperCase().default('MXN'),
  satCode: z.string().max(20).toUpperCase().optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

export const accountQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  isActive: z.coerce.boolean().optional(),
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  allowPosting: z.coerce.boolean().optional(),
  search: z.string().max(160).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AccountQuery = z.infer<typeof accountQuerySchema>;