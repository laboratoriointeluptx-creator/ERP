import { z } from 'zod';

// ObjectId de MongoDB (24 hex) o código de organización (por ejemplo `LAB-DEMO`).
const organizationReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[A-Za-z0-9][A-Za-z0-9 ._\-]{0,31}$/, 'Invalid organization id or code');

export const loginSchema = z.object({
  organizationId: organizationReferenceSchema,
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
