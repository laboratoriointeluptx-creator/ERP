import type { RequestHandler } from 'express';
import { HttpError } from '../../../shared/http.js';
import { verifyAccessToken, type AccessTokenPayload } from '../services/token.service.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

export const requireAuthentication: RequestHandler = (request, _response, next) => {
  const authorization = request.header('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    next(new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required'));
    return;
  }

  try {
    request.auth = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, 'INVALID_TOKEN', 'Invalid or expired access token'));
  }
};