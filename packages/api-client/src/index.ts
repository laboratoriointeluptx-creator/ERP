import type { ApiFailure, ApiSuccess, AuthSession, DashboardSummary, OrganizationSummary } from '@erp-universal/types';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;

  public constructor(status: number, failure: ApiFailure) {
    super(failure.error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = failure.error.code;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | undefined;
}

export class ApiClient {
  public constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.options.getAccessToken?.();
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (response.status === 204) return undefined as T;
    const body = (await response.json()) as ApiSuccess<T> | ApiFailure;
    if (!response.ok || !body.success) {
      throw new ApiClientError(response.status, body as ApiFailure);
    }
    return body.data;
  }

  public login(input: { organizationId: string; email: string; password: string }): Promise<AuthSession> {
    return this.request<AuthSession>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(input) });
  }

  public getCurrentOrganization(): Promise<OrganizationSummary> {
    return this.request<OrganizationSummary>('/api/v1/organizations/me');
  }

  public getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/api/v1/dashboard/summary');
  }

  public refresh(refreshToken: string): Promise<{ accessToken: string }> {
    return this.request<{ accessToken: string }>('/api/v1/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  }

  public logout(refreshToken: string): Promise<void> {
    return this.request<void>('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  }
}
