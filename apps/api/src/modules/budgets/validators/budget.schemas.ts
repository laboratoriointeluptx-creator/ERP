import { z } from 'zod';

export const budgetLineSchema = z.object({
  accountId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  budgetedAmount: z.string().regex(/^\d+(\.\d{1,4})?$/),
});

export const createBudgetSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional(),
  fiscalYear: z.coerce.number().int().min(2020).max(2099),
  currency: z.string().length(3).toUpperCase().default('MXN'),
  lines: z.array(budgetLineSchema).optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export const budgetQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  fiscalYear: z.coerce.number().int().min(2020).max(2099).optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED']).optional(),
  search: z.string().max(160).optional(),
});

export const approveBudgetSchema = z.object({
  approvedBy: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetQuery = z.infer<typeof budgetQuerySchema>;
export type ApproveBudgetInput = z.infer<typeof approveBudgetSchema>;
export type BudgetLineInput = z.infer<typeof budgetLineSchema>;