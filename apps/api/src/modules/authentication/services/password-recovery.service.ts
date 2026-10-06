import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { HttpError } from '../../../shared/http.js';
import { EmailProviderError } from '../../email/providers/email-provider.js';
import type { PasswordRecoveryEmailSender, PasswordRecoveryOperations, PasswordRecoveryStore } from '../types/password-recovery.types.js';

const recoveryTokenSchema = z.string().regex(/^[a-f\d]{64}$/i);
const newPasswordSchema = z.string().min(12).max(128);
const resetTokenLifetimeMs = 30 * 60 * 1000;
const invalidResetTokenError = (): HttpError =>
  new HttpError(400, 'INVALID_OR_EXPIRED_RESET_TOKEN', 'The password reset token is invalid or expired');

export interface PasswordRecoveryLogger {
  warn(code: string): void;
}

export interface PasswordRecoveryConfig {
  frontendBaseUrl?: string;
  emailFrom?: string;
}

export class PasswordRecoveryService implements PasswordRecoveryOperations {
  public constructor(
    private readonly store: PasswordRecoveryStore,
    private readonly emailSender: PasswordRecoveryEmailSender,
    private readonly passwordHasher: (password: string) => Promise<string>,
    private readonly config: PasswordRecoveryConfig,
    private readonly logger: PasswordRecoveryLogger = {
      warn: (code) => console.warn('Password recovery email delivery failed', { code }),
    },
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async requestPasswordReset(organizationId: string, email: string, ip?: string): Promise<void> {
    if (!this.config.frontendBaseUrl || !this.config.emailFrom) {
      throw new HttpError(503, 'PASSWORD_RECOVERY_UNAVAILABLE', 'Password recovery is temporarily unavailable');
    }

    const normalizedEmail = z.string().email().max(254).parse(email).toLowerCase();
    const account = await this.store.findActiveUserByEmail(organizationId, normalizedEmail);
    if (!account) return;

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const requestedAt = this.now();
    const expiresAt = new Date(requestedAt.getTime() + resetTokenLifetimeMs);

    await this.store.transaction(async (unitOfWork) => {
      await unitOfWork.invalidateOutstandingTokens(account.organizationId, account.id, requestedAt);
      await unitOfWork.createToken({
        organizationId: account.organizationId,
        userId: account.id,
        tokenHash,
        expiresAt,
      });
      await unitOfWork.recordAudit({
        organizationId: account.organizationId,
        userId: account.id,
        action: 'password_reset.requested',
        module: 'authentication',
        entity: 'User',
        entityId: account.id,
        ...(ip ? { ip } : {}),
        after: { recoveryRequested: true },
      });
      return true;
    });

    const baseUrl = `${this.config.frontendBaseUrl.replace(/\/+$/, '')}/`;
    const resetUrl = new URL('reset-password', baseUrl);
    resetUrl.searchParams.set('token', token);

    try {
      await this.emailSender.sendPasswordRecovery({
        from: this.config.emailFrom,
        to: account.email,
        actionUrl: resetUrl.toString(),
        expiresInMinutes: resetTokenLifetimeMs / 60_000,
      });
    } catch (error: unknown) {
      this.logger.warn(error instanceof EmailProviderError ? error.code : 'EMAIL_DELIVERY_FAILED');
    }
  }

  public async resetPassword(tokenInput: string, passwordInput: string, ip?: string): Promise<void> {
    const token = recoveryTokenSchema.parse(tokenInput);
    const password = newPasswordSchema.parse(passwordInput);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    if (!(await this.store.findValidToken(tokenHash, this.now()))) throw invalidResetTokenError();

    const passwordHash = await this.passwordHasher(password);
    const consumedAt = this.now();
    const completed = await this.store.transaction(async (unitOfWork) => {
      const consumed = await unitOfWork.consumeToken(tokenHash, consumedAt);
      if (!consumed) return false;

      const passwordUpdated = await unitOfWork.updatePassword(
        consumed.organizationId,
        consumed.userId,
        passwordHash,
      );
      if (!passwordUpdated) throw invalidResetTokenError();

      await unitOfWork.invalidateOutstandingTokens(consumed.organizationId, consumed.userId, consumedAt);
      await unitOfWork.revokeSessions(consumed.organizationId, consumed.userId, consumedAt);
      await unitOfWork.recordAudit({
        organizationId: consumed.organizationId,
        userId: consumed.userId,
        action: 'password_reset.completed',
        module: 'authentication',
        entity: 'User',
        entityId: consumed.userId,
        ...(ip ? { ip } : {}),
        before: { passwordChanged: false },
        after: { passwordChanged: true },
      });
      return true;
    });

    if (!completed) throw invalidResetTokenError();
  }
}
