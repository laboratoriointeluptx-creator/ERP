export interface OrganizationDocument {
  name: string;
  code: string;
  timezone: string;
  currency: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
