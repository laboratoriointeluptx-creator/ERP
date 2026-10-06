import { EmailProviderError, type EmailProvider, type TransactionalEmailMessage } from '../src/modules/email/providers/email-provider.js';
import { ResendEmailProvider } from '../src/modules/email/providers/resend-email.provider.js';
import { EmailService } from '../src/modules/email/services/email.service.js';

class RecordingEmailProvider implements EmailProvider {
  public readonly messages: TransactionalEmailMessage[] = [];
  public failure: Error | undefined;

  public async send(message: TransactionalEmailMessage): Promise<{ id: string }> {
    if (this.failure) throw this.failure;
    this.messages.push(message);
    return { id: 'email-test-id' };
  }
}

describe('EmailService', () => {
  let provider: RecordingEmailProvider;
  let service: EmailService;

  beforeEach(() => {
    provider = new RecordingEmailProvider();
    service = new EmailService(provider);
  });

  it('sends a validated transactional message through the provider contract', async () => {
    await expect(service.sendTransactional({
      from: 'SYNTARA <mail@example.com>',
      to: 'user@example.com',
      subject: 'A transaction',
      text: 'Message body',
    })).resolves.toEqual({ id: 'email-test-id' });

    expect(provider.messages[0]).toEqual({
      from: 'SYNTARA <mail@example.com>',
      to: ['user@example.com'],
      subject: 'A transaction',
      text: 'Message body',
    });
  });

  it('rejects non-HTTPS recovery URLs before sending', () => {
    expect(() => service.sendPasswordRecovery({
      from: 'mail@example.com',
      to: 'user@example.com',
      actionUrl: 'javascript:alert(1)',
      expiresInMinutes: 30,
    })).toThrow();

    expect(provider.messages).toHaveLength(0);
  });

  it('sends password recovery and verification templates', async () => {
    await service.sendPasswordRecovery({
      from: 'mail@example.com',
      to: 'user@example.com',
      actionUrl: 'https://erp.example.com/reset?token=opaque',
      expiresInMinutes: 30,
    });
    await service.sendEmailVerification({
      from: 'mail@example.com',
      to: 'user@example.com',
      actionUrl: 'https://erp.example.com/verify?token=opaque',
    });

    expect(provider.messages[0]?.subject).toBe('Restablece tu contraseña');
    expect(provider.messages[1]?.subject).toBe('Verifica tu correo electrónico');
    expect(provider.messages).toHaveLength(2);
  });

  it('escapes invitation content in HTML', async () => {
    await service.sendUserInvitation({
      from: 'mail@example.com',
      to: 'user@example.com',
      actionUrl: 'https://erp.example.com/invite?token=opaque',
      organizationName: '<script>alert(1)</script>',
      inviterName: 'A & B',
    });

    expect(provider.messages[0]?.html).toContain('&lt;script&gt;');
    expect(provider.messages[0]?.html).toContain('A &amp; B');
    expect(provider.messages[0]?.html).not.toContain('<script>');
  });

  it('sanitizes provider errors instead of exposing provider details', async () => {
    provider.failure = new Error('provider response included a sensitive credential');

    await expect(service.sendTransactional({
      from: 'mail@example.com',
      to: 'user@example.com',
      subject: 'A transaction',
      text: 'Message body',
    })).rejects.toMatchObject({ code: 'EMAIL_DELIVERY_FAILED' });
  });

  it('reports missing API key without attempting network access', async () => {
    const unconfigured = new EmailService(new ResendEmailProvider(() => undefined));

    await expect(unconfigured.sendTransactional({
      from: 'mail@example.com',
      to: 'user@example.com',
      subject: 'A transaction',
      text: 'Message body',
    })).rejects.toMatchObject({
      code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      message: 'Email provider is not configured',
    } satisfies Partial<EmailProviderError>);
  });
});