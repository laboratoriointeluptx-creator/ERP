import type { RequestHandler } from 'express';
import { HttpError } from '../../../shared/http.js';
import { roleHasPermission, type Permission } from '../permissions.js';

export const requirePermission = (permission: Permission): RequestHandler => (request, _response, next) => {
  const roles = request.auth?.roles ?? [];
  if (!roleHasPermission(roles, permission)) {
    next(new HttpError(403, 'FORBIDDEN', 'Insufficient permissions'));
    return;
  }
  next();
};
