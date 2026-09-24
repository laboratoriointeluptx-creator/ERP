import { createHash, randomBytes } from 'node:crypto';
import { SessionModel } from '../models/session.model.js';
import { HttpError } from '../../../shared/http.js';
import { findActiveUserById, findUserForLogin } from '../../users/repositories/user.repository.js';
import { verifyPassword } from './password.service.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from './token.service.js';
import type { LoginInput } from '../validators/auth.schemas.js';

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export const login = async (input: LoginInput): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await findUserForLogin(input.organizationId, input.email);
  const validPassword = user ? await verifyPassword(input.password, user.passwordHash) : false;

  if (!user || !validPassword) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }

  const session = await SessionModel.create({
    organizationId: user.organizationId,
    userId: user._id,
    refreshTokenHash: hashToken(randomBytes(32).toString('hex')),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  const refreshToken = createRefreshToken({ sub: user._id.toString(), sessionId: session._id.toString() });
  await SessionModel.updateOne({ _id: session._id }, { $set: { refreshTokenHash: hashToken(refreshToken) } }).exec();

  return {
    accessToken: createAccessToken({
      sub: user._id.toString(),
      organizationId: user.organizationId.toString(),
      roles: user.roles,
    }),
    refreshToken,
  };
};

export const refresh = async (refreshToken: string): Promise<{ accessToken: string }> => {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const session = await SessionModel.findOne({ _id: payload.sessionId, userId: payload.sub, refreshTokenHash: hashToken(refreshToken), revokedAt: null }).exec();
    if (!session || session.expiresAt <= new Date()) {
      throw new Error('Invalid session');
    }
    const user = await findActiveUserById(session.userId.toString(), session.organizationId.toString());
    if (!user) {
      throw new Error('Invalid session');
    }
    return { accessToken: createAccessToken({ sub: user._id.toString(), organizationId: user.organizationId.toString(), roles: user.roles }) };
  } catch {
    throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }
};

export const logout = async (refreshToken: string): Promise<void> => {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await SessionModel.updateOne(
      { _id: payload.sessionId, userId: payload.sub, refreshTokenHash: hashToken(refreshToken), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ).exec();
  } catch {
    throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }
};
