import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getDeliveries, modifyDelivery, registerDelivery, removeDelivery } from '../services/delivery.service.js';
import { deliveryQuerySchema, createDeliverySchema, updateDeliverySchema } from '../validators/delivery.schemas.js';

export const deliveryRouter = Router();
deliveryRouter.use(requireAuthentication);

deliveryRouter.get('/', requirePermission(permissions.deliveriesRead), async (request, response, next) => {
  try {
    const query = deliveryQuerySchema.parse(request.query);
    const result = await getDeliveries(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

deliveryRouter.post('/', requirePermission(permissions.deliveriesCreate), async (request, response, next) => {
  try {
    const delivery = await registerDelivery(request.auth!.organizationId, createDeliverySchema.parse(request.body));
    const body: ApiSuccess<typeof delivery> = { success: true, data: delivery };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

deliveryRouter.patch('/:id', requirePermission(permissions.deliveriesUpdate), async (request, response, next) => {
  try {
    const delivery = await modifyDelivery(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateDeliverySchema.parse(request.body), request.ip);
    response.json({ success: true, data: delivery } satisfies ApiSuccess<typeof delivery>);
  } catch (error: unknown) { next(error); }
});

deliveryRouter.delete('/:id', requirePermission(permissions.deliveriesUpdate), async (request, response, next) => {
  try {
    await removeDelivery(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});