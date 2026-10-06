import { Resend } from 'resend';
import { EmailProviderError, type EmailProvider, type EmailProviderResult, type TransactionalEmailMessage } from './email-provider.js';

export class ResendEmailProvider implements EmailProvider {
  private client: Resend | undefined;

  public constructor(private readonly getApiKey: () => string | undefined) {}

  public async send(message: TransactionalEmailMessage): Promise<EmailProviderResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new EmailProviderError('EMAIL_PROVIDER_NOT_CONFIGURED');
    }

    try {
      this.client ??= new Resend(apiKey);
      const base = { from: message.from, to: message.to, subject: message.subject };
      const response = message.html && message.text
        ? await this.client.emails.send({ ...base, html: message.html, text: message.text })
        : message.html
          ? await this.client.emails.send({ ...base, html: message.html })
          : message.text
            ? await this.client.emails.send({ ...base, text: message.text })
            : undefined;
      if (!response) throw new EmailProviderError('EMAIL_DELIVERY_FAILED');
      const { data, error } = response;
      if (error || !data?.id) {
        throw new EmailProviderError('EMAIL_DELIVERY_FAILED');
      }
      return { id: data.id };
    } catch {
      throw new EmailProviderError('EMAIL_DELIVERY_FAILED');
    }
  }
}
