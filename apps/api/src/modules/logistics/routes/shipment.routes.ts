import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { registerShipment } from '../services/shipment.service.js';
import { createShipmentSchema } from '../validators/shipment.schemas.js';

export const shipmentRouter = Router();
shipmentRouter.use(requireAuthentication);

shipmentRouter.post('/', requirePermission(permissions.shipmentsCreate), async (request, response, next) => {
  try {
    const data = await registerShipment(request.auth!.organizationId, createShipmentSchema.parse(request.body));
    response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});
