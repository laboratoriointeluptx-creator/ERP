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
  refreshToken: string;
}

export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
}

export interface DashboardActivity {
  id: string;
  module: string;
  reference: string;
  status: string;
  createdAt: string;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  recentActivity: DashboardActivity[];
  generatedAt: string;
}
