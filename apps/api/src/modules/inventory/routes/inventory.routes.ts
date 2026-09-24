import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { applyInventoryMovement } from '../repositories/inventory.repository.js';
import { movementSchema } from '../validators/inventory.schemas.js';

export const inventoryRouter = Router();
inventoryRouter.use(requireAuthentication);

inventoryRouter.post('/movements', requirePermission(permissions.inventoryAdjust), async (request, response, next) => {
  try {
    const data = await applyInventoryMovement(request.auth!.organizationId, movementSchema.parse(request.body));
    const body: ApiSuccess<typeof data> = { success: true, data };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
