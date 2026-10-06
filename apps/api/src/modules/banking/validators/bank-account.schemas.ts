import { z } from 'zod';

export const createBankAccountSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(120),
  bankName: z.string().min(1).max(120),
  accountNumber: z.string().min(1).max(50),
  clabe: z.string().max(18).optional(),
  swift: z.string().max(11).optional(),
  currency: z.string().length(3).toUpperCase().default('MXN'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT']).default('CHECKING'),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  isActive: z.boolean().default(true),
  accountId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export const updateBankAccountSchema = createBankAccountSchema.partial();

export const bankAccountQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  isActive: z.coerce.boolean().optional(),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT']).optional(),
  currency: z.string().length(3).optional(),
  search: z.string().max(120).optional(),
});

export const reconciliationSchema = z.object({
  bankAccountId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  statementDate: z.coerce.date(),
  statementBalance: z.string().regex(/^-?\d+(\.\d{1,4})?$/),
  lines: z.array(z.object({
    date: z.coerce.date(),
    description: z.string().max(500),
    amount: z.string().regex(/^-?\d+(\.\d{1,4})?$/),
    reference: z.string().max(100).optional(),
    matched: z.boolean().default(false),
    journalEntryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  })),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
export type BankAccountQuery = z.infer<typeof bankAccountQuerySchema>;
export type ReconciliationInput = z.infer<typeof reconciliationSchema>;