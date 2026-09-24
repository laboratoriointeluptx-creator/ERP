import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { applyInventoryMovement, listInventoryBalances, listInventoryMovements } from '../repositories/inventory.repository.js';
import { inventoryMovementQuerySchema, inventoryQuerySchema, movementSchema } from '../validators/inventory.schemas.js';

export const inventoryRouter = Router();
inventoryRouter.use(requireAuthentication);

inventoryRouter.get('/', requirePermission(permissions.inventoryRead), async (request, response, next) => {
  try {
    const query = inventoryQuerySchema.parse(request.query);
    const result = await listInventoryBalances(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

inventoryRouter.get('/movements', requirePermission(permissions.inventoryRead), async (request, response, next) => {
  try {
    const query = inventoryMovementQuerySchema.parse(request.query);
    const result = await listInventoryMovements(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

inventoryRouter.post('/movements', requirePermission(permissions.inventoryAdjust), async (request, response, next) => {
  try {
    const data = await applyInventoryMovement(request.auth!.organizationId, movementSchema.parse(request.body));
    const body: ApiSuccess<typeof data> = { success: true, data };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
