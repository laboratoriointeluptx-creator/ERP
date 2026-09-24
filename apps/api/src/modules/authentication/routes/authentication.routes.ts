import { Router } from 'express';
import { z } from 'zod';
import { login, logout, refresh } from '../services/authentication.service.js';
import { loginSchema } from '../validators/auth.schemas.js';
import type { ApiSuccess } from '../../../shared/http.js';

export const authenticationRouter = Router();

authenticationRouter.post('/login', async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const data = await login(input);
    const body: ApiSuccess<typeof data> = { success: true, data };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

authenticationRouter.post('/refresh', async (request, response, next) => {
  try {
    const token = z.object({ refreshToken: z.string().min(1) }).parse(request.body).refreshToken;
    const data = await refresh(token);
    const body: ApiSuccess<typeof data> = { success: true, data };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

authenticationRouter.post('/logout', async (request, response, next) => {
  try {
    const token = z.object({ refreshToken: z.string().min(1) }).parse(request.body).refreshToken;
    await logout(token);
    response.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});
