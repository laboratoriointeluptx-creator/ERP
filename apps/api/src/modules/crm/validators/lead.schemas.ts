import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const decimal = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Value must be a decimal string');

export const createLeadSchema = z.object({
  customerId: objectId.optional(),
  name: z.string().trim().min(1).max(160),
  email: z.string().email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  source: z.string().trim().max(80).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  estimatedValue: decimal.optional(),
}).strict();

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LeadQuery = z.infer<typeof leadQuerySchema>;
