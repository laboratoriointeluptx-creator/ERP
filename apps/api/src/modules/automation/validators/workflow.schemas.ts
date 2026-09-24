import { z } from 'zod';

export const executeWorkflowSchema = z.object({
  trigger: z.string().trim().min(1).max(120),
  subjectType: z.string().trim().min(1).max(80),
  subjectId: z.string().trim().min(1).max(80),
  context: z.record(z.unknown()).default({}),
}).strict();

export type ExecuteWorkflowInput = z.infer<typeof executeWorkflowSchema>;
