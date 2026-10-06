import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getMrpRuns, registerMrpRun, runMrp } from '../services/mrp.service.js';
import { createMrpRunSchema, mrpRunQuerySchema } from '../validators/mrp.schemas.js';

export const mrpRouter = Router();
mrpRouter.use(requireAuthentication);

mrpRouter.get('/', requirePermission(permissions.mrpRead), async (request, response, next) => {
  try {
    const query = mrpRunQuerySchema.parse(request.query);
    const result = await getMrpRuns(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

mrpRouter.post('/', requirePermission(permissions.mrpRun), async (request, response, next) => {
  try {
    const run = await registerMrpRun(request.auth!.organizationId, createMrpRunSchema.parse(request.body));
    const body: ApiSuccess<typeof run> = { success: true, data: run };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

mrpRouter.post('/:id/run', requirePermission(permissions.mrpRun), async (request, response, next) => {
  try {
    const run = await runMrp(request.auth!.organizationId, request.auth!.sub, String(request.params.id));
    response.json({ success: true, data: run } satisfies ApiSuccess<typeof run>);
  } catch (error: unknown) { next(error); }
});