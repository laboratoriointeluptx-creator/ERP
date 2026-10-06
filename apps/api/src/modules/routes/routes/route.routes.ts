import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getRoutes, modifyRoute, registerRoute, removeRoute } from '../services/route.service.js';
import { routeQuerySchema, createRouteSchema, updateRouteSchema } from '../validators/route.schemas.js';

export const routeRouter = Router();
routeRouter.use(requireAuthentication);

routeRouter.get('/', requirePermission(permissions.routesRead), async (request, response, next) => {
  try {
    const query = routeQuerySchema.parse(request.query);
    const result = await getRoutes(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

routeRouter.post('/', requirePermission(permissions.routesCreate), async (request, response, next) => {
  try {
    const route = await registerRoute(request.auth!.organizationId, createRouteSchema.parse(request.body));
    const body: ApiSuccess<typeof route> = { success: true, data: route };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

routeRouter.patch('/:id', requirePermission(permissions.routesUpdate), async (request, response, next) => {
  try {
    const route = await modifyRoute(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateRouteSchema.parse(request.body), request.ip);
    response.json({ success: true, data: route } satisfies ApiSuccess<typeof route>);
  } catch (error: unknown) { next(error); }
});

routeRouter.delete('/:id', requirePermission(permissions.routesUpdate), async (request, response, next) => {
  try {
    await removeRoute(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});