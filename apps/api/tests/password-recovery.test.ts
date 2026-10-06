import { createHash } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import type { AuditEvent } from '../src/modules/audit/services/audit.service.js';
import { createAuthenticationRouter } from '../src/modules/authentication/routes/authentication.routes.js';
import { PasswordRecoveryService } from '../src/modules/authentication/services/password-recovery.service.js';
import type {
  NewPasswordResetToken,
  PasswordRecoveryAccount,
  PasswordRecoveryEmailSender,
  PasswordRecoveryStore,
  PasswordRecoveryUnitOfWork,
  PasswordResetIdentity,
} from '../src/modules/authentication/types/password-recovery.types.js';
import { EmailService } from '../src/modules/email/services/email.service.js';
import type { EmailProvider, TransactionalEmailMessage } from '../src/modules/email/providers/email-provider.js';
import { errorHandler } from '../src/shared/http.js';

const organizationId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439012';
const recipient = 'user@example.com';
const fixedNow = new Date('2026-10-02T12:00:00.000Z');

interface StoredResetToken extends NewPasswordResetToken {
  usedAt?: Date;
  invalidatedAt?: Date;
}

class MemoryPasswordRecoveryStore implements PasswordRecoveryStore {
  public account: PasswordRecoveryAccount | null = { id: userId, organizationId, email: recipient };
  public readonly tokens: StoredResetToken[] = [];
  public readonly auditEvents: AuditEvent[] = [];
  public passwordHash: string | undefined;
  public sessionsRevoked = false;

  public async findActiveUserByEmail(_organizationId: string, email: string): Promise<PasswordRecoveryAccount | null> {
    return this.account?.email === email ? this.account : null;
  }

  public async findValidToken(tokenHash: string, now: Date): Promise<PasswordResetIdentity | null> {
    const token = this.tokens.find((entry) => entry.tokenHash === tokenHash
      && entry.expiresAt > now
      && !entry.usedAt
      && !entry.invalidatedAt);
    return token ? { organizationId: token.organizationId, userId: token.userId } : null;
  }

  public async transaction<T>(operation: (unitOfWork: PasswordRecoveryUnitOfWork) => Promise<T>): Promise<T> {
    const unitOfWork: PasswordRecoveryUnitOfWork = {
      invalidateOutstandingTokens: async (orgId, targetUserId, at) => {
        for (const token of this.tokens) {
          if (token.organizationId === orgId && token.userId === targetUserId && !token.usedAt && !token.invalidatedAt) {
            token.invalidatedAt = at;
          }
        }
      },
      createToken: async (input) => { this.tokens.push({ ...input }); },
      consumeToken: async (hash, now) => {
        const token = this.tokens.find((entry) => entry.tokenHash === hash
          && entry.expiresAt > now
          && !entry.usedAt
          && !entry.invalidatedAt);
        if (!token) return null;
        token.usedAt = now;
        return { organizationId: token.organizationId, userId: token.userId };
      },
      updatePassword: async (orgId, targetUserId, hash) => {
        if (!this.account || this.account.organizationId !== orgId || this.account.id !== targetUserId) return false;
        this.passwordHash = hash;
        return true;
      },
      revokeSessions: async () => { this.sessionsRevoked = true; },
      recordAudit: async (event) => { this.auditEvents.push(event); },
    };
    return operation(unitOfWork);
  }
}

class RecordingEmailProvider implements EmailProvider {
  public readonly messages: TransactionalEmailMessage[] = [];
  public failure: Error | undefined;

  public async send(message: TransactionalEmailMessage): Promise<{ id: string }> {
    if (this.failure) throw this.failure;
    this.messages.push(message);
    return { id: 'recovery-email-id' };
  }
}

const buildService = (store = new MemoryPasswordRecoveryStore()) => {
  const emailProvider = new RecordingEmailProvider();
  const warnings: string[] = [];
  const emailSender: PasswordRecoveryEmailSender = new EmailService(emailProvider);
  const service = new PasswordRecoveryService(
    store,
    emailSender,
    async (password) => `bcrypt-hash:${password}`,
    { frontendBaseUrl: 'https://erp.example.com', emailFrom: 'SYNTARA <mail@example.com>' },
    { warn: (code) => warnings.push(code) },
    () => new Date(fixedNow),
  );
  return { service, store, emailProvider, warnings };
};

const tokenFromEmail = (provider: RecordingEmailProvider): string => {
  const html = provider.messages[0]?.html;
  if (!html) throw new Error('Recovery email was not generated');
  const match = /reset-password\?token=([a-f\d]{64})/i.exec(html);
  if (!match?.[1]) throw new Error('Recovery email did not contain its action token');
  return match[1];
};

describe('password recovery service', () => {
  it('creates a hashed, expiring token and sends the existing recovery template', async () => {
    const { service, store, emailProvider } = buildService();

    await service.requestPasswordReset(organizationId, recipient, '203.0.113.10');

    expect(store.tokens).toHaveLength(1);
    expect(store.tokens[0]?.tokenHash).toMatch(/^[a-f\d]{64}$/i);
    expect(store.tokens[0]?.expiresAt.getTime()).toBe(fixedNow.getTime() + 30 * 60 * 1000);
    expect(emailProvider.messages).toHaveLength(1);
    expect(emailProvider.messages[0]?.subject).toBe('Restablece tu contraseña');
    expect(store.auditEvents[0]).toMatchObject({ action: 'password_reset.requested', userId, organizationId });
    expect(JSON.stringify(store.auditEvents)).not.toContain(tokenFromEmail(emailProvider));
  });

  it('returns the same successful result and sends nothing for an unknown email', async () => {
    const existing = buildService();
    const missingStore = new MemoryPasswordRecoveryStore();
    missingStore.account = null;
    const missing = buildService(missingStore);

    await expect(existing.service.requestPasswordReset(organizationId, recipient)).resolves.toBeUndefined();
    await expect(missing.service.requestPasswordReset(organizationId, recipient)).resolves.toBeUndefined();
    expect(missing.emailProvider.messages).toHaveLength(0);
    expect(missing.store.tokens).toHaveLength(0);
    expect(missing.store.auditEvents).toHaveLength(0);
  });

  it('changes the password, consumes the token, revokes sessions and audits without secrets', async () => {
    const { service, store, emailProvider } = buildService();
    await service.requestPasswordReset(organizationId, recipient);
    const token = tokenFromEmail(emailProvider);

    await service.resetPassword(token, 'new-secure-password-2026');

    expect(store.passwordHash).toBe('bcrypt-hash:new-secure-password-2026');
    expect(store.tokens[0]?.usedAt).toEqual(fixedNow);
    expect(store.sessionsRevoked).toBe(true);
    expect(store.auditEvents.at(-1)).toMatchObject({ action: 'password_reset.completed', userId, organizationId });
    expect(JSON.stringify(store.auditEvents)).not.toContain('new-secure-password-2026');
    expect(JSON.stringify(store.auditEvents)).not.toContain(token);
  });

  it('rejects expired and invalid tokens', async () => {
    const { service, store } = buildService();
    const expiredToken = 'a'.repeat(64);
    store.tokens.push({
      organizationId,
      userId,
      tokenHash: createHash('sha256').update(expiredToken).digest('hex'),
      expiresAt: new Date(fixedNow.getTime() - 1),
    });

    await expect(service.resetPassword(expiredToken, 'valid-new-password-2026')).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_RESET_TOKEN' });
    await expect(service.resetPassword('b'.repeat(64), 'valid-new-password-2026')).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_RESET_TOKEN' });
    expect(store.passwordHash).toBeUndefined();
  });

  it('rejects a reused token and never updates the password twice', async () => {
    const { service, store, emailProvider } = buildService();
    await service.requestPasswordReset(organizationId, recipient);
    const token = tokenFromEmail(emailProvider);

    await service.resetPassword(token, 'first-valid-password-2026');
    await expect(service.resetPassword(token, 'second-valid-password-2026')).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_RESET_TOKEN' });
    expect(store.passwordHash).toBe('bcrypt-hash:first-valid-password-2026');
  });

  it('rejects an invalid new password before consuming a valid token', async () => {
    const { service, store, emailProvider } = buildService();
    await service.requestPasswordReset(organizationId, recipient);
    const token = tokenFromEmail(emailProvider);

    await expect(service.resetPassword(token, 'short')).rejects.toThrow();
    expect(store.tokens[0]?.usedAt).toBeUndefined();
    expect(store.passwordHash).toBeUndefined();
  });

  it('does not put recovery tokens or passwords into audit events or warning logs', async () => {
    const { service, store, emailProvider } = buildService();
    await service.requestPasswordReset(organizationId, recipient);
    const token = tokenFromEmail(emailProvider);
    await service.resetPassword(token, 'private-password-2026');

    expect(JSON.stringify(store.auditEvents)).not.toContain(token);
    expect(JSON.stringify(store.auditEvents)).not.toContain('private-password-2026');
    expect(JSON.stringify(store.auditEvents)).not.toContain(createHash('sha256').update(token).digest('hex'));
  });

  it('logs only a generic provider error when recovery email delivery fails', async () => {
    const { service, emailProvider, warnings } = buildService();
    emailProvider.failure = new Error('sensitive provider token and password details');

    await expect(service.requestPasswordReset(organizationId, recipient)).resolves.toBeUndefined();

    expect(warnings).toEqual(['EMAIL_DELIVERY_FAILED']);
    expect(JSON.stringify(warnings)).not.toContain('sensitive provider');
  });
});

describe('password recovery HTTP routes', () => {
  const app = express();
  const calls: Array<{ method: string; args: string[] }> = [];
  const recovery = {
    async requestPasswordReset(tenantId: string, email: string) {
      calls.push({ method: 'forgot', args: [tenantId, email] });
    },
    async resetPassword(token: string, password: string) {
      calls.push({ method: 'reset', args: [token, password] });
    },
  };
  app.use(express.json());
  app.use('/api/v1/auth', createAuthenticationRouter(recovery));
  app.use(errorHandler);

  beforeEach(() => { calls.length = 0; });

  it('returns the same anti-enumeration response and does not disclose token fields', async () => {
    const response = await request(app).post('/api/v1/auth/forgot-password').send({ organizationId, email: recipient });

    expect(response.status).toBe(202);
    expect(response.body.data).toEqual({ accepted: true });
    expect(response.text).not.toContain(recipient);
    expect(response.text).not.toMatch(/token|password/i);
    expect(calls[0]?.method).toBe('forgot');
  });

  it('returns an identical HTTP response when the account does not exist', async () => {
    const existing = buildService();
    const missingStore = new MemoryPasswordRecoveryStore();
    missingStore.account = null;
    const missing = buildService(missingStore);
    const existingApp = express();
    const missingApp = express();
    existingApp.use('/api/v1/auth', express.json(), createAuthenticationRouter(existing.service));
    missingApp.use('/api/v1/auth', express.json(), createAuthenticationRouter(missing.service));
    existingApp.use(errorHandler);
    missingApp.use(errorHandler);

    const [existingResponse, missingResponse] = await Promise.all([
      request(existingApp).post('/api/v1/auth/forgot-password').send({ organizationId, email: recipient }),
      request(missingApp).post('/api/v1/auth/forgot-password').send({ organizationId, email: recipient }),
    ]);

    expect(existingResponse.status).toBe(missingResponse.status);
    expect(existingResponse.body).toEqual(missingResponse.body);
    expect(existing.emailProvider.messages).toHaveLength(1);
    expect(missing.emailProvider.messages).toHaveLength(0);
  });

  it('does not echo the submitted token or password from reset response', async () => {
    const token = 'c'.repeat(64);
    const password = 'private-new-password-2026';
    const response = await request(app).post('/api/v1/auth/reset-password').send({ token, newPassword: password });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ changed: true });
    expect(response.text).not.toContain(token);
    expect(response.text).not.toContain(password);
  });
});
