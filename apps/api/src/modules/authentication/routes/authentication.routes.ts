import { Router } from 'express';
import { z } from 'zod';
import { login, logout, refresh } from '../services/authentication.service.js';
import { passwordRecoveryService } from '../password-recovery.module.js';
import { loginSchema } from '../validators/auth.schemas.js';
import { forgotPasswordSchema, resetPasswordSchema } from '../validators/password-recovery.schemas.js';
import type { ApiSuccess } from '../../../shared/http.js';
import type { PasswordRecoveryOperations } from '../types/password-recovery.types.js';

export const createAuthenticationRouter = (
  passwordRecovery: PasswordRecoveryOperations = passwordRecoveryService,
): Router => {
  const router = Router();

  router.post('/forgot-password', async (request, response, next) => {
    try {
      const input = forgotPasswordSchema.parse(request.body);
      await passwordRecovery.requestPasswordReset(input.organizationId, input.email, request.ip);
      response.status(202).json({
        success: true,
        data: { accepted: true },
        message: 'If an active account matches that address, recovery instructions will be sent.',
      } satisfies ApiSuccess<{ accepted: true }>);
    } catch (error: unknown) {
      next(error);
    }
  });

  router.post('/reset-password', async (request, response, next) => {
    try {
      const input = resetPasswordSchema.parse(request.body);
      await passwordRecovery.resetPassword(input.token, input.newPassword, request.ip);
      response.json({
        success: true,
        data: { changed: true },
        message: 'Password updated successfully.',
      } satisfies ApiSuccess<{ changed: true }>);
    } catch (error: unknown) {
      next(error);
    }
  });

  router.post('/login', async (request, response, next) => {
    try {
      const input = loginSchema.parse(request.body);
      const data = await login(input);
      const body: ApiSuccess<typeof data> = { success: true, data };
      response.json(body);
    } catch (error: unknown) {
      next(error);
    }
  });

  router.post('/refresh', async (request, response, next) => {
    try {
      const token = z.object({ refreshToken: z.string().min(1) }).parse(request.body).refreshToken;
      const data = await refresh(token);
      const body: ApiSuccess<typeof data> = { success: true, data };
      response.json(body);
    } catch (error: unknown) {
      next(error);
    }
  });

  router.post('/logout', async (request, response, next) => {
    try {
      const token = z.object({ refreshToken: z.string().min(1) }).parse(request.body).refreshToken;
      await logout(token);
      response.status(204).send();
    } catch (error: unknown) {
      next(error);
    }
  });

  return router;
};

export const authenticationRouter = createAuthenticationRouter();
