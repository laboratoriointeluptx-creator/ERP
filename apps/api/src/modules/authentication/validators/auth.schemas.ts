import { z } from 'zod';

export const loginSchema = z.object({
  organizationId: z.string().regex(/^[a-f\d]{24}$/i),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
