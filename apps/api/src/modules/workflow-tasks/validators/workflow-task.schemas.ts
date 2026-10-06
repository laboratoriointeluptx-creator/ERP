import { z } from 'zod';

export const workflowTaskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  executionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  workflowId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'WAITING', 'CANCELLED']).optional(),
  type: z.enum(['ACTION', 'CONDITION', 'APPROVAL', 'NOTIFICATION', 'WAIT', 'SCRIPT', 'INTEGRATION']).optional(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(200).optional(),
});

export type WorkflowTaskQuery = z.infer<typeof workflowTaskQuerySchema>;