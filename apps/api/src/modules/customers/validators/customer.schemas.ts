import { z } from 'zod';

export const createCustomerSchema = z.object({
  code: z.string().trim().min(1).max(32).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(160),
  email: z.string().email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  taxId: z.string().trim().max(20).transform((value) => value.toUpperCase()).optional(),
}).strict();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(160).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
