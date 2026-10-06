import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getMaterials, updateMaterial, allocate } from '../services/material.service.js';
import { materialQuerySchema } from '../validators/material.schemas.js';

export const materialRouter = Router();
materialRouter.use(requireAuthentication);

materialRouter.get('/', requirePermission(permissions.materialsRead), async (request, response, next) => {
  try {
    const query = materialQuerySchema.parse(request.query);
    const result = await getMaterials(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

materialRouter.patch('/:id/status', requirePermission(permissions.materialsConsume), async (request, response, next) => {
  try {
    const material = await updateMaterial(request.auth!.organizationId, String(request.params.id), request.body.status);
    response.json({ success: true, data: material } satisfies ApiSuccess<typeof material>);
  } catch (error: unknown) { next(error); }
});

materialRouter.post('/:id/allocate', requirePermission(permissions.materialsConsume), async (request, response, next) => {
  try {
    const material = await allocate(request.auth!.organizationId, String(request.params.id), request.body.quantity, request.body.productionOrderId);
    response.json({ success: true, data: material } satisfies ApiSuccess<typeof material>);
  } catch (error: unknown) { next(error); }
});