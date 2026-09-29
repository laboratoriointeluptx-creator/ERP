import { z } from 'zod';

export const userParamsSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });

export const createUserSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  initialPassword: z.string().min(12).max(128),
}).strict();

export const updateUserStatusSchema = z.object({ active: z.boolean() }).strict();

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(160).optional(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
