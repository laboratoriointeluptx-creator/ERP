import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getBoms, getActiveBomForProduct, modifyBom, registerBom, removeBom, calculateBomCost } from '../services/bom.service.js';
import { bomQuerySchema, createBomSchema, updateBomSchema } from '../validators/bom.schemas.js';

export const bomRouter = Router();
bomRouter.use(requireAuthentication);

bomRouter.get('/', requirePermission(permissions.billsOfMaterialsRead), async (request, response, next) => {
  try {
    const query = bomQuerySchema.parse(request.query);
    const result = await getBoms(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

bomRouter.get('/product/:productId/active', requirePermission(permissions.billsOfMaterialsRead), async (request, response, next) => {
  try {
    const date = request.query.date ? new Date(request.query.date as string) : undefined;
    const bom = await getActiveBomForProduct(request.auth!.organizationId, String(request.params.productId), date);
    const body: ApiSuccess<typeof bom> = { success: true, data: bom };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

bomRouter.get('/:id/cost', requirePermission(permissions.billsOfMaterialsRead), async (request, response, next) => {
  try {
    const cost = await calculateBomCost(request.auth!.organizationId, String(request.params.id));
    const body: ApiSuccess<typeof cost> = { success: true, data: cost };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

bomRouter.post('/', requirePermission(permissions.billsOfMaterialsCreate), async (request, response, next) => {
  try {
    const bom = await registerBom(request.auth!.organizationId, createBomSchema.parse(request.body));
    const body: ApiSuccess<typeof bom> = { success: true, data: bom };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

bomRouter.patch('/:id', requirePermission(permissions.billsOfMaterialsUpdate), async (request, response, next) => {
  try {
    const bom = await modifyBom(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateBomSchema.parse(request.body), request.ip);
    response.json({ success: true, data: bom } satisfies ApiSuccess<typeof bom>);
  } catch (error: unknown) { next(error); }
});

bomRouter.delete('/:id', requirePermission(permissions.billsOfMaterialsDelete), async (request, response, next) => {
  try {
    await removeBom(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});