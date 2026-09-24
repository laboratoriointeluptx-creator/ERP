export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface OrganizationSummary {
  _id: string;
  name: string;
  code: string;
  timezone: string;
  currency: string;
  active: boolean;
}

export interface AuthSession {
  accessToken: string;
}
