import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getLeads, registerLead } from '../services/lead.service.js';
import { createLeadSchema, leadQuerySchema } from '../validators/lead.schemas.js';

export const leadRouter = Router();
leadRouter.use(requireAuthentication);

leadRouter.get('/', requirePermission(permissions.crmRead), async (request, response, next) => {
  try { const query = leadQuerySchema.parse(request.query); const data = await getLeads(request.auth!.organizationId, query); response.json({ success: true, data, meta: { page: query.page, limit: query.limit, total: data.total } } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});

leadRouter.post('/', requirePermission(permissions.crmCreate), async (request, response, next) => {
  try { const data = await registerLead(request.auth!.organizationId, createLeadSchema.parse(request.body)); response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});
