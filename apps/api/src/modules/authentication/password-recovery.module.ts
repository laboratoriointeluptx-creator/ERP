import { env } from '../../config/env.js';
import { emailService } from '../email/email.module.js';
import { hashPassword } from './services/password.service.js';
import { PasswordRecoveryService } from './services/password-recovery.service.js';
import { passwordRecoveryStore } from './repositories/password-recovery.repository.js';

export const passwordRecoveryService = new PasswordRecoveryService(
  passwordRecoveryStore,
  emailService,
  hashPassword,
  {
    ...(env.FRONTEND_BASE_URL ? { frontendBaseUrl: env.FRONTEND_BASE_URL } : {}),
    ...(env.EMAIL_FROM ? { emailFrom: env.EMAIL_FROM } : {}),
  },
);
