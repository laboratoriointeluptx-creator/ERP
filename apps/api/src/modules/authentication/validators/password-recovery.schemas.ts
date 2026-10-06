import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  organizationId: z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9][A-Za-z0-9 ._\-]{0,31}$/, 'Invalid organization id or code'),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f\d]{64}$/i),
  newPassword: z.string().min(12).max(128),
}).strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
