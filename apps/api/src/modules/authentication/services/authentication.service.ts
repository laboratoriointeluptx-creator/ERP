import { createHash, randomBytes } from 'node:crypto';
import { SessionModel } from '../models/session.model.js';
import { LoginAttemptModel } from '../models/login-attempt.model.js';
import { HttpError } from '../../../shared/http.js';
import { findActiveUserById, findUserForLogin } from '../../users/repositories/user.repository.js';
import { findOrganizationIdByReference } from '../../organizations/repositories/organization.repository.js';
import { verifyPassword } from './password.service.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from './token.service.js';
import type { LoginInput } from '../validators/auth.schemas.js';

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');
const loginAttemptLimit = 8;
const loginAttemptWindowMs = 15 * 60 * 1000;

const loginAttemptKey = (organizationId: string, email: string): string =>
  createHash('sha256').update(`${organizationId.trim().toUpperCase()}:${email.trim().toLowerCase()}`).digest('hex');

const recordLoginAttempt = async (key: string): Promise<number> => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + loginAttemptWindowMs);
  try {
    const bucket = await LoginAttemptModel.findOneAndUpdate(
      { key, expiresAt: { $gt: now } },
      { $inc: { attempts: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    return bucket?.attempts ?? 1;
  } catch (error: unknown) {
    if (!(error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000)) {
      throw error;
    }

    // A unique-key race can occur when two first attempts arrive together or a bucket expires.
    const expiredBucket = await LoginAttemptModel.findOneAndUpdate(
      { key, expiresAt: { $lte: now } },
      { $set: { attempts: 1, expiresAt } },
      { new: true },
    ).exec();
    if (expiredBucket) return expiredBucket.attempts;

    const activeBucket = await LoginAttemptModel.findOneAndUpdate(
      { key, expiresAt: { $gt: now } },
      { $inc: { attempts: 1 } },
      { new: true },
    ).exec();
    return activeBucket?.attempts ?? loginAttemptLimit + 1;
  }
};

export const login = async (input: LoginInput): Promise<{ accessToken: string; refreshToken: string }> => {
  // El cliente puede enviar el ObjectId o el código de la organización
  // (por ejemplo `LAB-DEMO`); se resuelve al ObjectId real antes de continuar.
  const organizationId = await findOrganizationIdByReference(input.organizationId);
  const attemptKey = loginAttemptKey(organizationId ?? input.organizationId, input.email);
  if (await recordLoginAttempt(attemptKey) > loginAttemptLimit) {
    throw new HttpError(429, 'LOGIN_RATE_LIMITED', 'Too many login attempts. Try again later.');
  }
  if (!organizationId) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }

  const user = await findUserForLogin(organizationId, input.email);
  const validPassword = user ? await verifyPassword(input.password, user.passwordHash) : false;

  if (!user || !validPassword) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }
  await LoginAttemptModel.deleteOne({ key: attemptKey }).exec();

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
