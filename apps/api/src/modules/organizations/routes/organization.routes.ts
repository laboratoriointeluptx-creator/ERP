import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getOrganization, updateOrganization } from '../services/organization.service.js';
import { updateOrganizationSchema } from '../validators/organization.schemas.js';

export const organizationRouter = Router();
organizationRouter.use(requireAuthentication);

organizationRouter.get('/me', async (request, response, next) => {
  try {
    const organization = await getOrganization(request.auth!.organizationId);
    const body: ApiSuccess<typeof organization> = { success: true, data: organization };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

organizationRouter.patch('/me', requirePermission(permissions.organizationsUpdate), async (request, response, next) => {
  try {
    const input = updateOrganizationSchema.parse(request.body);
    const organization = await updateOrganization(request.auth!.organizationId, input);
    const body: ApiSuccess<typeof organization> = { success: true, data: organization };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});
