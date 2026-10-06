import { env } from '../../config/env.js';
import { ResendEmailProvider } from './providers/resend-email.provider.js';
import { EmailService } from './services/email.service.js';

export const emailService = new EmailService(new ResendEmailProvider(() => env.RESEND_API_KEY));
