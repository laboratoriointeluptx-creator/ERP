import { z } from 'zod';

export const createRouteSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(120),
  carrierId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  origin: z.string().min(1).max(200),
  destination: z.string().min(1).max(200),
  distance: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  estimatedDuration: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND']).default('ON_DEMAND'),
  schedule: z.string().max(500).optional(),
  costPerKm: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  baseCost: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  isActive: z.boolean().default(true),
});

export const updateRouteSchema = createRouteSchema.partial();

export const routeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  carrierId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type RouteQuery = z.infer<typeof routeQuerySchema>;