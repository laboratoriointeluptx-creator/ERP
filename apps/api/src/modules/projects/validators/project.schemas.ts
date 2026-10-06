import { z } from 'zod';

export const createProjectSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.coerce.number().int().min(1).max(100).default(50),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  currency: z.string().length(3).toUpperCase().default('MXN'),
  projectManagerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  teamMembers: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  projectManagerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(160).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;