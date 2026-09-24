import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { registerSalesOrder } from '../services/sales-order.service.js';
import { createSalesOrderSchema } from '../validators/sales-order.schemas.js';

export const salesOrderRouter = Router();
salesOrderRouter.use(requireAuthentication);

salesOrderRouter.post('/', requirePermission(permissions.salesOrdersCreate), async (request, response, next) => {
  try {
    const order = await registerSalesOrder(request.auth!.organizationId, createSalesOrderSchema.parse(request.body));
    const body: ApiSuccess<typeof order> = { success: true, data: order };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
