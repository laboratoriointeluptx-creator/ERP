import { z } from 'zod';

export const workflowExecutionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  workflowId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'WAITING_APPROVAL']).optional(),
  triggerType: z.enum(['MANUAL', 'SCHEDULED', 'EVENT', 'WEBHOOK', 'API']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(100).optional(),
});

export type WorkflowExecutionQuery = z.infer<typeof workflowExecutionQuerySchema>;