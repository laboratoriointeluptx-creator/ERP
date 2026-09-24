import { z } from 'zod';

export const organizationIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid organization id');

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
}).strict();

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
