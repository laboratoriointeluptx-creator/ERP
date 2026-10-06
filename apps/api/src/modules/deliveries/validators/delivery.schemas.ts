import { z } from 'zod';

export const createDeliverySchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  shipmentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  routeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  carrierId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  driverName: z.string().max(120).optional(),
  vehiclePlate: z.string().max(20).optional(),
  status: z.enum(['SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED']).default('SCHEDULED'),
  scheduledDate: z.coerce.date(),
  actualDate: z.coerce.date().optional(),
  deliveryAddress: z.string().min(1).max(500),
  recipientName: z.string().max(120).optional(),
  recipientPhone: z.string().max(30).optional(),
  proofOfDelivery: z.string().max(500).optional(),
  signature: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  gpsCoordinates: z.object({
    latitude: z.string().optional(),
    longitude: z.string().optional(),
  }).optional(),
});

export const updateDeliverySchema = createDeliverySchema.partial();

export const deliveryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED']).optional(),
  shipmentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  carrierId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(160).optional(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type DeliveryQuery = z.infer<typeof deliveryQuerySchema>;