import type { AuditEvent } from '../../audit/services/audit.service.js';

export interface PasswordRecoveryAccount {
  id: string;
  organizationId: string;
  email: string;
}

export interface PasswordResetIdentity {
  organizationId: string;
  userId: string;
}

export interface NewPasswordResetToken {
  organizationId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface PasswordRecoveryUnitOfWork {
  invalidateOutstandingTokens(organizationId: string, userId: string, at: Date): Promise<void>;
  createToken(input: NewPasswordResetToken): Promise<void>;
  consumeToken(tokenHash: string, now: Date): Promise<PasswordResetIdentity | null>;
  updatePassword(organizationId: string, userId: string, passwordHash: string): Promise<boolean>;
  revokeSessions(organizationId: string, userId: string, at: Date): Promise<void>;
  recordAudit(event: AuditEvent): Promise<void>;
}

export interface PasswordRecoveryStore {
  findActiveUserByEmail(organizationId: string, email: string): Promise<PasswordRecoveryAccount | null>;
  findValidToken(tokenHash: string, now: Date): Promise<PasswordResetIdentity | null>;
  transaction<T>(operation: (unitOfWork: PasswordRecoveryUnitOfWork) => Promise<T>): Promise<T>;
}

export interface PasswordRecoveryEmailSender {
  sendPasswordRecovery(input: {
    from: string;
    to: string;
    actionUrl: string;
    expiresInMinutes: number;
  }): Promise<{ id: string }>;
}

export interface PasswordRecoveryOperations {
  requestPasswordReset(organizationId: string, email: string, ip?: string): Promise<void>;
  resetPassword(token: string, newPassword: string, ip?: string): Promise<void>;
}
