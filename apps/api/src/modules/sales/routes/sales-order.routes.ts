import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { cancelSalesOrder, confirmSalesOrder, listReturnableSalesOrders, listSalesOrders, registerSalesOrder } from '../services/sales-order.service.js';
import { confirmSalesOrderSchema, createSalesOrderSchema, returnableSalesOrderQuerySchema, salesOrderParamsSchema, salesOrderQuerySchema } from '../validators/sales-order.schemas.js';

export const salesOrderRouter = Router();
salesOrderRouter.use(requireAuthentication);

salesOrderRouter.get('/returnable', requirePermission(permissions.salesOrdersRead), async (request, response, next) => {
  try {
    const query = returnableSalesOrderQuerySchema.parse(request.query);
    const result = await listReturnableSalesOrders(request.auth!.organizationId, query);
    response.json({ success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});

salesOrderRouter.get('/', requirePermission(permissions.salesOrdersRead), async (request, response, next) => {
  try {
    const query = salesOrderQuerySchema.parse(request.query);
    const result = await listSalesOrders(request.auth!.organizationId, query);
    response.json({ success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});

salesOrderRouter.post('/:id/cancel', requirePermission(permissions.salesOrdersCancel), async (request, response, next) => {
  try {
    const { id } = salesOrderParamsSchema.parse(request.params);
    const result = await cancelSalesOrder(request.auth!.organizationId, request.auth!.sub, id, request.ip);
    const body: ApiSuccess<typeof result> = { success: true, data: result };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

salesOrderRouter.post('/:id/confirm', requirePermission(permissions.salesOrdersConfirm), async (request, response, next) => {
  try {
    const { id } = salesOrderParamsSchema.parse(request.params);
    const result = await confirmSalesOrder(
      request.auth!.organizationId,
      request.auth!.sub,
      id,
      confirmSalesOrderSchema.parse(request.body),
      request.ip,
    );
    const body: ApiSuccess<typeof result> = { success: true, data: result };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

salesOrderRouter.post('/', requirePermission(permissions.salesOrdersCreate), async (request, response, next) => {
  try {
    const order = await registerSalesOrder(request.auth!.organizationId, createSalesOrderSchema.parse(request.body));
    const body: ApiSuccess<typeof order> = { success: true, data: order };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
