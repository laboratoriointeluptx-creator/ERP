import { z } from 'zod';

export const slaLevelSchema = z.object({
  name: z.string().min(1).max(50),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  responseTimeMinutes: z.coerce.number().int().min(0),
  resolutionTimeMinutes: z.coerce.number().int().min(0),
  businessHoursOnly: z.boolean().default(true),
  escalationLevels: z.array(z.object({
    level: z.coerce.number().int().positive(),
    notifyAfterMinutes: z.coerce.number().int().min(0),
    assigneeRole: z.string().max(50).optional(),
    assigneeIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  })).optional(),
});

export const coverageHoursSchema = z.object({
  monday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/), isWorking: z.boolean().default(true) }),
  tuesday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/), isWorking: z.boolean().default(true) }),
  wednesday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/), isWorking: z.boolean().default(true) }),
  thursday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/), isWorking: z.boolean().default(true) }),
  friday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/), isWorking: z.boolean().default(true) }),
  saturday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/), isWorking: z.boolean().default(false) }),
  sunday: z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/), isWorking: z.boolean().default(false) }),
});

export const createSlaSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  coverageHours: coverageHoursSchema.optional(),
  holidays: z.array(z.object({ date: z.coerce.date(), name: z.string().max(100) })).optional(),
  levels: z.array(slaLevelSchema).min(1),
  excludedCategories: z.array(z.string().max(50)).optional(),
});

export const updateSlaSchema = createSlaSchema.partial();

export const slaQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  isActive: z.coerce.boolean().optional(),
  isDefault: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
});

export type CreateSlaInput = z.infer<typeof createSlaSchema>;
export type UpdateSlaInput = z.infer<typeof updateSlaSchema>;
export type SlaQuery = z.infer<typeof slaQuerySchema>;
export type SlaLevelInput = z.infer<typeof slaLevelSchema>;