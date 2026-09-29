import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createShipmentSchema = z.object({
  salesOrderId: objectId,
  number: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  carrier: z.string().trim().max(120).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
  shippingAddress: z.string().trim().min(1).max(500),
}).strict();

export const shipmentParamsSchema = z.object({ id: objectId });
export const shipmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['PENDING', 'PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).optional(),
}).strict();

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
