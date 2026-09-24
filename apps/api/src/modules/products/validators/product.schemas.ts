import { z } from 'zod';

const moneyPattern = /^\d+(\.\d{1,4})?$/;

export const createProductSchema = z.object({
  sku: z.string().trim().min(1).max(64).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  unit: z.string().trim().min(1).max(16).transform((value) => value.toUpperCase()).default('PZA'),
  salePrice: z.string().regex(moneyPattern, 'salePrice must be a decimal string'),
}).strict();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
