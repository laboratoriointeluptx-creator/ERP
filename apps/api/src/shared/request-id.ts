import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const requestId = request.header('x-request-id')?.trim() || randomUUID();
  request.requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
};
