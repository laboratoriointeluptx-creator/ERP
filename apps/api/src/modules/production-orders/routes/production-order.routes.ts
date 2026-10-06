import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getProductionOrders, registerProductionOrder, modifyProductionOrder, releaseOrder, startOrder, completeOrder, cancelOrder } from '../services/production-order.service.js';
import { completeProductionOrderSchema, createProductionOrderSchema, productionOrderQuerySchema, releaseProductionOrderSchema, updateProductionOrderSchema } from '../validators/production-order.schemas.js';

export const productionOrderRouter = Router();
productionOrderRouter.use(requireAuthentication);

productionOrderRouter.get('/', requirePermission(permissions.productionOrdersRead), async (request, response, next) => {
  try {
    const query = productionOrderQuerySchema.parse(request.query);
    const result = await getProductionOrders(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

productionOrderRouter.post('/', requirePermission(permissions.productionOrdersCreate), async (request, response, next) => {
  try {
    const order = await registerProductionOrder(request.auth!.organizationId, createProductionOrderSchema.parse(request.body));
    const body: ApiSuccess<typeof order> = { success: true, data: order };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

productionOrderRouter.patch('/:id', requirePermission(permissions.productionOrdersUpdate), async (request, response, next) => {
  try {
    const order = await modifyProductionOrder(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateProductionOrderSchema.parse(request.body), request.ip);
    response.json({ success: true, data: order } satisfies ApiSuccess<typeof order>);
  } catch (error: unknown) { next(error); }
});

productionOrderRouter.post('/:id/release', requirePermission(permissions.productionOrdersStart), async (request, response, next) => {
  try {
    const order = await releaseOrder(request.auth!.organizationId, request.auth!.sub, String(request.params.id), releaseProductionOrderSchema.parse(request.body), request.ip);
    response.json({ success: true, data: order } satisfies ApiSuccess<typeof order>);
  } catch (error: unknown) { next(error); }
});

productionOrderRouter.post('/:id/start', requirePermission(permissions.productionOrdersStart), async (request, response, next) => {
  try {
    const order = await startOrder(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.json({ success: true, data: order } satisfies ApiSuccess<typeof order>);
  } catch (error: unknown) { next(error); }
});

productionOrderRouter.post('/:id/complete', requirePermission(permissions.productionOrdersComplete), async (request, response, next) => {
  try {
    const order = await completeOrder(request.auth!.organizationId, request.auth!.sub, String(request.params.id), completeProductionOrderSchema.parse(request.body), request.ip);
    response.json({ success: true, data: order } satisfies ApiSuccess<typeof order>);
  } catch (error: unknown) { next(error); }
});

productionOrderRouter.post('/:id/cancel', requirePermission(permissions.productionOrdersUpdate), async (request, response, next) => {
  try {
    const order = await cancelOrder(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.json({ success: true, data: order } satisfies ApiSuccess<typeof order>);
  } catch (error: unknown) { next(error); }
});