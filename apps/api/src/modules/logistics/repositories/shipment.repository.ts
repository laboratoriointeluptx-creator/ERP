import { ShipmentModel, type Shipment } from '../models/shipment.model.js';
import type { CreateShipmentInput } from '../validators/shipment.schemas.js';

export const createShipment = (organizationId: string, input: CreateShipmentInput): Promise<Shipment> => ShipmentModel.create({ organizationId, ...input });
