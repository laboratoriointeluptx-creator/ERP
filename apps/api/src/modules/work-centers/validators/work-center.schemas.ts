import { z } from 'zod';

export const createWorkCenterSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  type: z.enum(['MACHINE', 'LABOR', 'MIXED']).default('MACHINE'),
  capacityPerDay: z.string().regex(/^\d+(\.\d{1,4})?$/),
  capacityUom: z.enum(['HOURS', 'UNITS']).default('HOURS'),
  efficiency: z.string().regex(/^\d+(\.\d{1,4})?$/).default('1'),
  costPerHour: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  location: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
  calendarId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  machineIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  employeeIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
});

export const updateWorkCenterSchema = createWorkCenterSchema.partial();

export const workCenterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['MACHINE', 'LABOR', 'MIXED']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
});

export type CreateWorkCenterInput = z.infer<typeof createWorkCenterSchema>;
export type UpdateWorkCenterInput = z.infer<typeof updateWorkCenterSchema>;
export type WorkCenterQuery = z.infer<typeof workCenterQuerySchema>;