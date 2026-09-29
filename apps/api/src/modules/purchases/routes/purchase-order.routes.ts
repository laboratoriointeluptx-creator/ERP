import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { listPurchaseOrders, listReturnablePurchaseOrders, registerPurchaseOrder, sendPurchaseOrder } from '../services/purchase-order.service.js';
import { receivePurchaseOrder } from '../services/purchase-order-receipt.service.js';
import { createPurchaseOrderSchema, purchaseOrderQuerySchema, receivePurchaseOrderParamsSchema, receivePurchaseOrderSchema, returnablePurchaseOrderQuerySchema } from '../validators/purchase-order.schemas.js';

export const purchaseOrderRouter = Router();
purchaseOrderRouter.use(requireAuthentication);

purchaseOrderRouter.get('/returnable', requirePermission(permissions.purchaseOrdersRead), async (request, response, next) => {
  try {
    const query = returnablePurchaseOrderQuerySchema.parse(request.query);
    const result = await listReturnablePurchaseOrders(request.auth!.organizationId, query);
    response.json({ success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});

purchaseOrderRouter.get('/', requirePermission(permissions.purchaseOrdersRead), async (request, response, next) => {
  try {
    const query = purchaseOrderQuerySchema.parse(request.query);
    const result = await listPurchaseOrders(request.auth!.organizationId, query);
    response.json({ success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});

purchaseOrderRouter.post('/:id/send', requirePermission(permissions.purchaseOrdersSend), async (request, response, next) => {
  try {
    const { id } = receivePurchaseOrderParamsSchema.parse(request.params);
    const result = await sendPurchaseOrder(request.auth!.organizationId, request.auth!.sub, id, request.ip);
    response.json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});

purchaseOrderRouter.post('/:id/receipts', requirePermission(permissions.purchaseOrdersReceive), async (request, response, next) => {
  try {
    const { id } = receivePurchaseOrderParamsSchema.parse(request.params);
    const input = receivePurchaseOrderSchema.parse(request.body);
    const result = await receivePurchaseOrder(request.auth!.organizationId, request.auth!.sub, id, input, request.ip);
    const body: ApiSuccess<typeof result> = { success: true, data: result };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});

purchaseOrderRouter.post('/', requirePermission(permissions.purchaseOrdersCreate), async (request, response, next) => {
  try {
    const input = createPurchaseOrderSchema.parse(request.body);
    const order = await registerPurchaseOrder(request.auth!.organizationId, input);
    const body: ApiSuccess<typeof order> = { success: true, data: order };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
