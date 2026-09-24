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

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
