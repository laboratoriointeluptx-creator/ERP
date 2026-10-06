import { z } from 'zod';
import { EmailProviderError, type EmailProvider, type TransactionalEmailMessage } from '../providers/email-provider.js';

const recipientSchema = z.union([z.string().email().max(254), z.array(z.string().email().max(254)).min(1).max(50)]);
const senderSchema = z.string().trim().min(3).max(320).refine((value) => {
  if (/[\r\n]/.test(value)) return false;
  const match = /^(?:[^<>]*<([^<>]+)>|([^<>]+))$/.exec(value);
  const address = match?.[1] ?? match?.[2];
  return address ? z.string().email().safeParse(address.trim()).success : false;
}, 'Sender must contain a valid email address');
const actionUrlSchema = z.string().url().max(2048).refine((value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
});
const messageSchema = z.object({
  from: senderSchema,
  to: recipientSchema,
  subject: z.string().trim().min(1).max(200).refine((value) => !/[\r\n]/.test(value)),
  html: z.string().max(100_000).optional(),
  text: z.string().max(100_000).optional(),
}).strict().refine((message) => Boolean(message.html || message.text), 'Email must include html or text content');

export interface TransactionalEmailInput {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface ActionEmailInput {
  from: string;
  to: string;
  actionUrl: string;
}

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const validateActionEmail = (input: ActionEmailInput): ActionEmailInput => ({
  ...input,
  ...{ actionUrl: actionUrlSchema.parse(input.actionUrl) },
  to: z.string().email().max(254).parse(input.to),
  from: senderSchema.parse(input.from),
});

export class EmailService {
  public constructor(private readonly provider: EmailProvider) {}

  public async sendTransactional(input: TransactionalEmailInput): Promise<{ id: string }> {
    const parsed = messageSchema.parse(input);
    const message: TransactionalEmailMessage = {
      from: parsed.from,
      to: Array.isArray(parsed.to) ? parsed.to : [parsed.to],
      subject: parsed.subject,
      ...(parsed.html ? { html: parsed.html } : {}),
      ...(parsed.text ? { text: parsed.text } : {}),
    };
    try {
      return await this.provider.send(message);
    } catch (error: unknown) {
      if (error instanceof EmailProviderError) throw error;
      throw new EmailProviderError('EMAIL_DELIVERY_FAILED');
    }
  }

  public sendPasswordRecovery(input: ActionEmailInput & { expiresInMinutes: number }): Promise<{ id: string }> {
    const valid = validateActionEmail(input);
    const duration = z.number().int().positive().max(1440).parse(input.expiresInMinutes);
    return this.sendTransactional({
      from: valid.from,
      to: valid.to,
      subject: 'Restablece tu contraseña',
      text: `Usa este enlace para restablecer tu contraseña. Expira en ${duration} minutos: ${valid.actionUrl}`,
      html: `<p>Usa el siguiente enlace para restablecer tu contraseña. Expira en ${duration} minutos.</p><p><a href="${escapeHtml(valid.actionUrl)}">Restablecer contraseña</a></p>`,
    });
  }

  public sendEmailVerification(input: ActionEmailInput): Promise<{ id: string }> {
    const valid = validateActionEmail(input);
    return this.sendTransactional({
      from: valid.from,
      to: valid.to,
      subject: 'Verifica tu correo electrónico',
      text: `Confirma tu correo electrónico: ${valid.actionUrl}`,
      html: `<p>Confirma tu correo electrónico para continuar.</p><p><a href="${escapeHtml(valid.actionUrl)}">Verificar correo</a></p>`,
    });
  }

  public sendUserInvitation(input: ActionEmailInput & { organizationName: string; inviterName: string }): Promise<{ id: string }> {
    const valid = validateActionEmail(input);
    const organizationName = z.string().trim().min(1).max(160).parse(input.organizationName);
    const inviterName = z.string().trim().min(1).max(160).parse(input.inviterName);
    return this.sendTransactional({
      from: valid.from,
      to: valid.to,
      subject: `Invitación para unirte a ${organizationName}`,
      text: `${inviterName} te invitó a unirte a ${organizationName}. Acepta la invitación: ${valid.actionUrl}`,
      html: `<p>${escapeHtml(inviterName)} te invitó a unirte a ${escapeHtml(organizationName)}.</p><p><a href="${escapeHtml(valid.actionUrl)}">Aceptar invitación</a></p>`,
    });
  }
}
