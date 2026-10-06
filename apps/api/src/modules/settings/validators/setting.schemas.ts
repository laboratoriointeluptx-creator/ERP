import { z } from 'zod';

export const createSettingSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.unknown(),
  scope: z.enum(['organization', 'branch', 'user']).default('organization'),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  dataType: z.enum(['string', 'number', 'boolean', 'json', 'date']).default('string'),
});

export const updateSettingSchema = createSettingSchema.partial();

export const settingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  scope: z.enum(['organization', 'branch', 'user']).optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(120).optional(),
});

export const settingParamsSchema = z.object({
  key: z.string().min(1).max(120),
});

export const settingScopeQuerySchema = settingQuerySchema.pick({ scope: true, branchId: true, userId: true });

export type CreateSettingInput = z.infer<typeof createSettingSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type SettingQuery = z.infer<typeof settingQuerySchema>;