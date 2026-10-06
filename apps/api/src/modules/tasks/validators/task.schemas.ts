import { z } from 'zod';

export const createTaskSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).default('TODO'),
  priority: z.coerce.number().int().min(1).max(100).default(50),
  assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  reporterId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  parentTaskId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dependsOn: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).optional(),
  assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(160).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;