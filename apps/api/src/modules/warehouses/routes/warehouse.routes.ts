import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getWarehouses, modifyWarehouse, registerWarehouse } from '../services/warehouse.service.js';
import { createWarehouseSchema, updateWarehouseSchema, warehouseQuerySchema } from '../validators/warehouse.schemas.js';

export const warehouseRouter = Router();
warehouseRouter.use(requireAuthentication);

warehouseRouter.get('/', requirePermission(permissions.warehousesRead), async (request, response, next) => {
  try {
    const query = warehouseQuerySchema.parse(request.query);
    const result = await getWarehouses(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

warehouseRouter.post('/', requirePermission(permissions.warehousesCreate), async (request, response, next) => {
  try {
    const warehouse = await registerWarehouse(request.auth!.organizationId, createWarehouseSchema.parse(request.body));
    const body: ApiSuccess<typeof warehouse> = { success: true, data: warehouse };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});

warehouseRouter.patch('/:id', requirePermission(permissions.warehousesUpdate), async (request, response, next) => {
  try {
    const warehouse = await modifyWarehouse(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateWarehouseSchema.parse(request.body), request.ip);
    response.json({ success: true, data: warehouse } satisfies ApiSuccess<typeof warehouse>);
  } catch (error: unknown) { next(error); }
});
