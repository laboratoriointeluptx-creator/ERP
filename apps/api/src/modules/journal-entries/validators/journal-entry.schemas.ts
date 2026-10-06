import { z } from 'zod';

export const journalEntryLineSchema = z.object({
  accountId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  description: z.string().max(500).optional(),
  debitAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  creditAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  taxId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  taxBase: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  taxAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  costCenterId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

const journalEntryBaseSchema = z.object({
  journalCode: z.string().min(1).max(20).toUpperCase(),
  number: z.string().min(1).max(30),
  date: z.coerce.date().default(() => new Date()),
  description: z.string().min(3).max(1000),
  referenceType: z.string().max(80).optional(),
  referenceId: z.string().max(80).optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  lines: z.array(journalEntryLineSchema).min(2),
  currency: z.string().length(3).toUpperCase().default('MXN'),
  exchangeRate: z.string().regex(/^\d+(\.\d{1,6})?$/).default('1'),
  periodId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export const createJournalEntrySchema = journalEntryBaseSchema.refine((data) => {
  const totalDebit = data.lines.reduce((sum, l) => sum + Number(l.debitAmount), 0);
  const totalCredit = data.lines.reduce((sum, l) => sum + Number(l.creditAmount), 0);
  return Math.abs(totalDebit - totalCredit) < 0.0001;
}, { message: 'Total debits must equal total credits', path: ['lines'] });

export const updateJournalEntrySchema = journalEntryBaseSchema.partial().omit({ journalCode: true, number: true });

export const postJournalEntrySchema = z.object({
  reversalReason: z.string().max(500).optional(),
});

export const journalEntryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['DRAFT', 'POSTED', 'REVERSED', 'VOIDED']).optional(),
  journalCode: z.string().max(20).optional(),
  accountId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  periodId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(160).optional(),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
export type PostJournalEntryInput = z.infer<typeof postJournalEntrySchema>;
export type JournalEntryQuery = z.infer<typeof journalEntryQuerySchema>;
export type JournalEntryLineInput = z.infer<typeof journalEntryLineSchema>;