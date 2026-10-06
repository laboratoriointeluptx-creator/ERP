import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getWorkCenters, modifyWorkCenter, registerWorkCenter, removeWorkCenter } from '../services/work-center.service.js';
import { createWorkCenterSchema, updateWorkCenterSchema, workCenterQuerySchema } from '../validators/work-center.schemas.js';

export const workCenterRouter = Router();
workCenterRouter.use(requireAuthentication);

workCenterRouter.get('/', requirePermission(permissions.workCentersRead), async (request, response, next) => {
  try {
    const query = workCenterQuerySchema.parse(request.query);
    const result = await getWorkCenters(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

workCenterRouter.post('/', requirePermission(permissions.workCentersCreate), async (request, response, next) => {
  try {
    const center = await registerWorkCenter(request.auth!.organizationId, createWorkCenterSchema.parse(request.body));
    const body: ApiSuccess<typeof center> = { success: true, data: center };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

workCenterRouter.patch('/:id', requirePermission(permissions.workCentersUpdate), async (request, response, next) => {
  try {
    const center = await modifyWorkCenter(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateWorkCenterSchema.parse(request.body), request.ip);
    response.json({ success: true, data: center } satisfies ApiSuccess<typeof center>);
  } catch (error: unknown) { next(error); }
});

workCenterRouter.delete('/:id', requirePermission(permissions.workCentersUpdate), async (request, response, next) => {
  try {
    await removeWorkCenter(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});