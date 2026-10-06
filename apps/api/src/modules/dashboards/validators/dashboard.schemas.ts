import { z } from 'zod';

export const widgetSchema = z.object({
  reportId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  title: z.string().min(1).max(100),
  x: z.coerce.number().int().min(0),
  y: z.coerce.number().int().min(0),
  width: z.coerce.number().int().min(1).max(12),
  height: z.coerce.number().int().min(1).max(12),
  parameters: z.unknown().optional(),
  refreshInterval: z.coerce.number().int().min(0).default(0),
});

export const createDashboardSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  widgets: z.array(widgetSchema).optional(),
  layout: z.enum(['GRID', 'FREEFORM']).default('GRID'),
  columns: z.coerce.number().int().min(1).max(24).default(12),
  rowHeight: z.coerce.number().int().min(50).default(100),
  theme: z.enum(['LIGHT', 'DARK', 'AUTO']).default('AUTO'),
  tags: z.array(z.string().max(50)).optional(),
});

export const updateDashboardSchema = createDashboardSchema.partial();

export const dashboardQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  isPublic: z.coerce.boolean().optional(),
  ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(160).optional(),
});

export type CreateDashboardInput = z.infer<typeof createDashboardSchema>;
export type UpdateDashboardInput = z.infer<typeof updateDashboardSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type WidgetInput = z.infer<typeof widgetSchema>;