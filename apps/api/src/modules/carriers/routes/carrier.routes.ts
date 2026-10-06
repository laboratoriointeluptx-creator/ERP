import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getCarriers, modifyCarrier, registerCarrier, removeCarrier } from '../services/carrier.service.js';
import { carrierQuerySchema, createCarrierSchema, updateCarrierSchema } from '../validators/carrier.schemas.js';

export const carrierRouter = Router();
carrierRouter.use(requireAuthentication);

carrierRouter.get('/', requirePermission(permissions.carriersRead), async (request, response, next) => {
  try {
    const query = carrierQuerySchema.parse(request.query);
    const result = await getCarriers(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

carrierRouter.post('/', requirePermission(permissions.carriersCreate), async (request, response, next) => {
  try {
    const carrier = await registerCarrier(request.auth!.organizationId, createCarrierSchema.parse(request.body));
    const body: ApiSuccess<typeof carrier> = { success: true, data: carrier };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

carrierRouter.patch('/:id', requirePermission(permissions.carriersUpdate), async (request, response, next) => {
  try {
    const carrier = await modifyCarrier(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateCarrierSchema.parse(request.body), request.ip);
    response.json({ success: true, data: carrier } satisfies ApiSuccess<typeof carrier>);
  } catch (error: unknown) { next(error); }
});

carrierRouter.delete('/:id', requirePermission(permissions.carriersUpdate), async (request, response, next) => {
  try {
    await removeCarrier(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});