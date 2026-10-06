import { HttpError } from '../../../shared/http.js';
import { listMaterials, updateMaterialStatus, allocateMaterial } from '../repositories/material.repository.js';
import type { MaterialQuery } from '../validators/material.schemas.js';

export const getMaterials = (organizationId: string, query: MaterialQuery) => listMaterials(organizationId, query);

export const updateMaterial = async (organizationId: string, id: string, status: string) => {
  const updated = await updateMaterialStatus(organizationId, id, status);
  if (!updated) throw new HttpError(404, 'MATERIAL_NOT_FOUND', 'Material not found');
  return updated;
};

export const allocate = async (organizationId: string, id: string, quantity: string, productionOrderId: string) => {
  const updated = await allocateMaterial(organizationId, id, quantity, productionOrderId);
  if (!updated) throw new HttpError(404, 'MATERIAL_NOT_FOUND', 'Material not found');
  return updated;
};