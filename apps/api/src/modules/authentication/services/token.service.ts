import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  organizationId: string;
  roles: string[];
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
}

const getJwtSecret = (): string => {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required for authentication');
  }
  return env.JWT_SECRET;
};

const getRefreshSecret = (): string => {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required for refresh tokens');
  }
  return env.JWT_REFRESH_SECRET;
};

export const createAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, getJwtSecret());
  if (typeof payload !== 'object' || payload === null || typeof payload.sub !== 'string') {
    throw new Error('Invalid access token payload');
  }

  const organizationId = payload.organizationId;
  const roles = payload.roles;
  if (typeof organizationId !== 'string' || !Array.isArray(roles) || !roles.every((role) => typeof role === 'string')) {
    throw new Error('Invalid access token claims');
  }

  return { sub: payload.sub, organizationId, roles };
};

export const createRefreshToken = (payload: RefreshTokenPayload): string =>
  jwt.sign(payload, getRefreshSecret(), { expiresIn: '30d' });

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = jwt.verify(token, getRefreshSecret());
  if (typeof payload !== 'object' || payload === null || typeof payload.sub !== 'string' || typeof payload.sessionId !== 'string') {
    throw new Error('Invalid refresh token payload');
  }
  return { sub: payload.sub, sessionId: payload.sessionId };
};
