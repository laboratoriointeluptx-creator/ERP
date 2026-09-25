import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getDashboardSummary } from '../services/dashboard.service.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuthentication);
dashboardRouter.get('/summary', requirePermission(permissions.dashboardRead), async (request, response, next) => {
  try {
    const data = await getDashboardSummary(request.auth!.organizationId, request.auth!.roles);
    response.json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});
