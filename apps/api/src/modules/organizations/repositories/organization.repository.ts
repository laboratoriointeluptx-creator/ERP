import { OrganizationModel, type Organization } from '../models/organization.model.js';
import type { UpdateOrganizationInput } from '../validators/organization.schemas.js';

export const findOrganizationById = (organizationId: string): Promise<Organization | null> =>
  OrganizationModel.findOne({ _id: organizationId, active: true }).exec();

/**
 * Acepta tanto el ObjectId de 24 caracteres como el código de la organización
 * (por ejemplo `LAB-DEMO`) para que el login y la recuperación de contraseña
 * funcionen con cualquiera de los dos. Devuelve `null` cuando el código no
 * corresponde a ninguna organización.
 */
export const findOrganizationIdByReference = async (reference: string): Promise<string | null> => {
  const value = reference.trim();
  if (/^[a-f\d]{24}$/i.test(value)) return value;

  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const organization = await OrganizationModel.findOne({ code: { $regex: `^${escaped}$`, $options: 'i' } })
    .select('_id')
    .exec();
  return organization ? String(organization._id) : null;
};

export const updateOrganizationById = (
  organizationId: string,
  input: UpdateOrganizationInput,
): Promise<Organization | null> =>
  OrganizationModel.findOneAndUpdate(
    { _id: organizationId, active: true },
    { $set: input },
    { new: true, runValidators: true },
  ).exec();
