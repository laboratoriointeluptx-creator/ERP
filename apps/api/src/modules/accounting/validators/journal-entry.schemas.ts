import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const decimal = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Value must be a decimal string');

export const createJournalEntrySchema = z.object({
  number: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  date: z.coerce.date(),
  currency: z.string().trim().length(3).toUpperCase().default('MXN'),
  lines: z.array(z.object({
    accountId: objectId,
    description: z.string().trim().max(300).optional(),
    debit: decimal,
    credit: decimal,
  }).strict()).min(2),
  sourceType: z.string().trim().max(80).optional(),
  sourceId: z.string().trim().max(80).optional(),
}).strict();

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
