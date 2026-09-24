import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getOpportunities, registerOpportunity } from '../services/opportunity.service.js';
import { createOpportunitySchema, opportunityQuerySchema } from '../validators/opportunity.schemas.js';

export const opportunityRouter = Router();
opportunityRouter.use(requireAuthentication);

opportunityRouter.get('/', requirePermission(permissions.crmRead), async (request, response, next) => {
  try { const query = opportunityQuerySchema.parse(request.query); const data = await getOpportunities(request.auth!.organizationId, query); response.json({ success: true, data, meta: { page: query.page, limit: query.limit, total: data.total } } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});

opportunityRouter.post('/', requirePermission(permissions.crmCreate), async (request, response, next) => {
  try { const data = await registerOpportunity(request.auth!.organizationId, createOpportunitySchema.parse(request.body)); response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});
