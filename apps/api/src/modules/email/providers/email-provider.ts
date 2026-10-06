export interface TransactionalEmailMessage {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailProviderResult {
  id: string;
}

export class EmailProviderError extends Error {
  public readonly code: 'EMAIL_PROVIDER_NOT_CONFIGURED' | 'EMAIL_DELIVERY_FAILED';

  public constructor(code: EmailProviderError['code']) {
    super(code === 'EMAIL_PROVIDER_NOT_CONFIGURED' ? 'Email provider is not configured' : 'Email could not be delivered');
    this.name = 'EmailProviderError';
    this.code = code;
  }
}

export interface EmailProvider {
  send(message: TransactionalEmailMessage): Promise<EmailProviderResult>;
}
