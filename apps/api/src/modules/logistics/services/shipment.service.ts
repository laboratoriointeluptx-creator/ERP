import { HttpError } from '../../../shared/http.js';
import { createShipment } from '../repositories/shipment.repository.js';
import type { CreateShipmentInput } from '../validators/shipment.schemas.js';

export const registerShipment = async (organizationId: string, input: CreateShipmentInput) => {
  try {
    return await createShipment(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'SHIPMENT_NUMBER_EXISTS', 'Shipment number already exists');
    }
    throw error;
  }
};
