import { z } from 'zod';

export const createTimeEntrySchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  taskId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  date: z.coerce.date().default(() => new Date()),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.coerce.number().int().positive(),
  description: z.string().min(3).max(1000),
  billable: z.boolean().default(true),
  rate: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  cost: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
});

export const updateTimeEntrySchema = createTimeEntrySchema.partial();

export const timeEntryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  taskId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'BILLED']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  billable: z.coerce.boolean().optional(),
  search: z.string().max(160).optional(),
});

export const approveTimeEntrySchema = z.object({
  approvedBy: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type TimeEntryQuery = z.infer<typeof timeEntryQuerySchema>;
export type ApproveTimeEntryInput = z.infer<typeof approveTimeEntrySchema>;