import { OrganizationModel, type Organization } from '../models/organization.model.js';
import type { UpdateOrganizationInput } from '../validators/organization.schemas.js';

export const findOrganizationById = (organizationId: string): Promise<Organization | null> =>
  OrganizationModel.findOne({ _id: organizationId, active: true }).exec();

export const updateOrganizationById = (
  organizationId: string,
  input: UpdateOrganizationInput,
): Promise<Organization | null> =>
  OrganizationModel.findOneAndUpdate(
    { _id: organizationId, active: true },
    { $set: input },
    { new: true, runValidators: true },
  ).exec();
