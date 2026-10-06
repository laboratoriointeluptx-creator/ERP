import { z } from 'zod';

export const createCarrierSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(120),
  contactName: z.string().max(120).optional(),
  email: z.string().email().max(160).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  taxId: z.string().max(30).optional(),
  serviceLevel: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT', 'INTERNATIONAL']).default('STANDARD'),
  trackingUrl: z.string().max(500).optional(),
  apiEndpoint: z.string().max(500).optional(),
  apiKey: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
  rating: z.number().min(0).max(5).default(0),
});

export const updateCarrierSchema = createCarrierSchema.partial();

export const carrierQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  isActive: z.coerce.boolean().optional(),
  serviceLevel: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT', 'INTERNATIONAL']).optional(),
  search: z.string().max(120).optional(),
});

export type CreateCarrierInput = z.infer<typeof createCarrierSchema>;
export type UpdateCarrierInput = z.infer<typeof updateCarrierSchema>;
export type CarrierQuery = z.infer<typeof carrierQuerySchema>;