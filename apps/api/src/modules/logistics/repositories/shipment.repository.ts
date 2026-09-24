import { ShipmentModel, type Shipment } from '../models/shipment.model.js';
import type { ClientSession } from 'mongoose';
import type { CreateShipmentInput } from '../validators/shipment.schemas.js';

export const createShipment = async (organizationId: string, input: CreateShipmentInput, session?: ClientSession): Promise<Shipment> => {
  const [shipment] = await ShipmentModel.create([{ organizationId, ...input }], session ? { session } : {});
  if (!shipment) throw new Error('Shipment creation returned no document');
  return shipment;
};
