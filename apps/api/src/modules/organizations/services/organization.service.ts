import { HttpError } from '../../../shared/http.js';
import { findOrganizationById, updateOrganizationById } from '../repositories/organization.repository.js';
import type { UpdateOrganizationInput } from '../validators/organization.schemas.js';

export const getOrganization = async (organizationId: string) => {
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new HttpError(404, 'ORGANIZATION_NOT_FOUND', 'Organization not found');
  }
  return organization;
};

export const updateOrganization = async (organizationId: string, input: UpdateOrganizationInput) => {
  const organization = await updateOrganizationById(organizationId, input);
  if (!organization) {
    throw new HttpError(404, 'ORGANIZATION_NOT_FOUND', 'Organization not found');
  }
  return organization;
};
