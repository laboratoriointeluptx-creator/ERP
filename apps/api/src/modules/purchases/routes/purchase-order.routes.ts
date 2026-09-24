import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { registerPurchaseOrder } from '../services/purchase-order.service.js';
import { createPurchaseOrderSchema } from '../validators/purchase-order.schemas.js';

export const purchaseOrderRouter = Router();
purchaseOrderRouter.use(requireAuthentication);

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
