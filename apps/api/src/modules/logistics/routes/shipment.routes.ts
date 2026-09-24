import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { cancelShipment, deliverShipment, dispatchShipment, registerShipment } from '../services/shipment.service.js';
import { createShipmentSchema, shipmentParamsSchema } from '../validators/shipment.schemas.js';

export const shipmentRouter = Router();
shipmentRouter.use(requireAuthentication);

shipmentRouter.post('/:id/dispatch', requirePermission(permissions.shipmentsDispatch), async (request, response, next) => {
  try {
    const { id } = shipmentParamsSchema.parse(request.params);
    const data = await dispatchShipment(request.auth!.organizationId, request.auth!.sub, id, request.ip);
    response.json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});

shipmentRouter.post('/:id/cancel', requirePermission(permissions.shipmentsCancel), async (request, response, next) => {
  try {
    const { id } = shipmentParamsSchema.parse(request.params);
    const data = await cancelShipment(request.auth!.organizationId, request.auth!.sub, id, request.ip);
    response.json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});

shipmentRouter.post('/:id/deliver', requirePermission(permissions.shipmentsDeliver), async (request, response, next) => {
  try {
    const { id } = shipmentParamsSchema.parse(request.params);
    const data = await deliverShipment(request.auth!.organizationId, request.auth!.sub, id, request.ip);
    response.json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});

shipmentRouter.post('/', requirePermission(permissions.shipmentsCreate), async (request, response, next) => {
  try {
    const data = await registerShipment(request.auth!.organizationId, request.auth!.sub, createShipmentSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});
