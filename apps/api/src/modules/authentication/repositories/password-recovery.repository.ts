import mongoose, { type ClientSession } from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { SessionModel } from '../models/session.model.js';
import { PasswordResetTokenModel } from '../models/password-reset-token.model.js';
import { findActiveUserForPasswordRecovery, updateUserPasswordHash } from '../../users/repositories/user.repository.js';
import type {
  NewPasswordResetToken,
  PasswordRecoveryStore,
  PasswordRecoveryUnitOfWork,
  PasswordResetIdentity,
} from '../types/password-recovery.types.js';

const findValidToken = async (tokenHash: string, now: Date): Promise<PasswordResetIdentity | null> => {
  const token = await PasswordResetTokenModel.findOne({
    tokenHash,
    expiresAt: { $gt: now },
    usedAt: { $exists: false },
    invalidatedAt: { $exists: false },
  }).exec();
  return token ? { organizationId: token.organizationId.toString(), userId: token.userId.toString() } : null;
};

const transactionOperations = (session: ClientSession): PasswordRecoveryUnitOfWork => ({
  async invalidateOutstandingTokens(organizationId, userId, at) {
    await PasswordResetTokenModel.updateMany(
      { organizationId, userId, usedAt: { $exists: false }, invalidatedAt: { $exists: false } },
      { $set: { invalidatedAt: at } },
      { session },
    ).exec();
  },
  async createToken(input: NewPasswordResetToken) {
    await PasswordResetTokenModel.create([{ ...input }], { session });
  },
  async consumeToken(tokenHash, now) {
    const token = await PasswordResetTokenModel.findOneAndUpdate(
      {
        tokenHash,
        expiresAt: { $gt: now },
        usedAt: { $exists: false },
        invalidatedAt: { $exists: false },
      },
      { $set: { usedAt: now } },
      { new: true, includeResultMetadata: false, session },
    ).exec();
    return token ? { organizationId: token.organizationId.toString(), userId: token.userId.toString() } : null;
  },
  async updatePassword(organizationId, userId, passwordHash) {
    return updateUserPasswordHash(organizationId, userId, passwordHash, session);
  },
  async revokeSessions(organizationId, userId, at) {
    await SessionModel.updateMany(
      { organizationId, userId, revokedAt: null },
      { $set: { revokedAt: at } },
      { session },
    ).exec();
  },
  async recordAudit(event) {
    await recordAuditEvent(event, session);
  },
});

export const passwordRecoveryStore: PasswordRecoveryStore = {
  findActiveUserByEmail: findActiveUserForPasswordRecovery,
  findValidToken,
  async transaction<T>(operation: (unitOfWork: PasswordRecoveryUnitOfWork) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    let result: T | undefined;
    let completed = false;
    try {
      await session.withTransaction(async () => {
        result = await operation(transactionOperations(session));
        completed = true;
      });
      if (!completed || result === undefined) throw new Error('Password recovery transaction did not complete');
      return result;
    } finally {
      await session.endSession();
    }
  },
};
