import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getCategories, getUnits, registerCategory, registerUnit } from '../services/catalog.service.js';
import { catalogQuerySchema, createCategorySchema, createUnitSchema } from '../validators/catalog.schemas.js';

export const catalogRouter = Router();
catalogRouter.use(requireAuthentication);

catalogRouter.get('/categories', requirePermission(permissions.catalogsRead), async (request, response, next) => {
  try { const query = catalogQuerySchema.parse(request.query); const data = await getCategories(request.auth!.organizationId, query); response.json({ success: true, data, meta: { page: query.page, limit: query.limit, total: data.total } } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});

catalogRouter.post('/categories', requirePermission(permissions.catalogsCreate), async (request, response, next) => {
  try { const data = await registerCategory(request.auth!.organizationId, createCategorySchema.parse(request.body)); response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});

catalogRouter.get('/units', requirePermission(permissions.catalogsRead), async (request, response, next) => {
  try { const query = catalogQuerySchema.parse(request.query); const data = await getUnits(request.auth!.organizationId, query); response.json({ success: true, data, meta: { page: query.page, limit: query.limit, total: data.total } } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});

catalogRouter.post('/units', requirePermission(permissions.catalogsCreate), async (request, response, next) => {
  try { const data = await registerUnit(request.auth!.organizationId, createUnitSchema.parse(request.body)); response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});
