import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getPurchaseRequests, registerPurchaseRequest } from '../services/purchase-request.service.js';
import { createPurchaseRequestSchema, purchaseRequestQuerySchema } from '../validators/purchase-request.schemas.js';

export const purchaseRequestRouter = Router();
purchaseRequestRouter.use(requireAuthentication);

purchaseRequestRouter.get('/', requirePermission(permissions.purchaseRequestsRead), async (request, response, next) => {
  try {
    const query = purchaseRequestQuerySchema.parse(request.query);
    const result = await getPurchaseRequests(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

purchaseRequestRouter.post('/', requirePermission(permissions.purchaseRequestsCreate), async (request, response, next) => {
  try {
    const input = createPurchaseRequestSchema.parse(request.body);
    const result = await registerPurchaseRequest(request.auth!.organizationId, request.auth!.sub, input);
    const body: ApiSuccess<typeof result> = { success: true, data: result };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
