import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getTaxes, getApplicableTaxes, modifyTax, registerTax, removeTax } from '../services/tax.service.js';
import { createTaxSchema, taxQuerySchema, updateTaxSchema } from '../validators/tax.schemas.js';

export const taxRouter = Router();
taxRouter.use(requireAuthentication);

taxRouter.get('/', requirePermission(permissions.taxesRead), async (request, response, next) => {
  try {
    const query = taxQuerySchema.parse(request.query);
    const result = await getTaxes(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

taxRouter.get('/applicable', requirePermission(permissions.taxesRead), async (request, response, next) => {
  try {
    const appliesTo = (request.query.appliesTo as 'SALE' | 'PURCHASE' | 'BOTH') ?? 'BOTH';
    const date = request.query.date ? new Date(request.query.date as string) : undefined;
    const taxes = await getApplicableTaxes(request.auth!.organizationId, appliesTo, date);
    const body: ApiSuccess<typeof taxes> = { success: true, data: taxes };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

taxRouter.post('/', requirePermission(permissions.taxesCreate), async (request, response, next) => {
  try {
    const tax = await registerTax(request.auth!.organizationId, createTaxSchema.parse(request.body));
    const body: ApiSuccess<typeof tax> = { success: true, data: tax };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

taxRouter.patch('/:id', requirePermission(permissions.taxesUpdate), async (request, response, next) => {
  try {
    const tax = await modifyTax(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateTaxSchema.parse(request.body), request.ip);
    response.json({ success: true, data: tax } satisfies ApiSuccess<typeof tax>);
  } catch (error: unknown) { next(error); }
});

taxRouter.delete('/:id', requirePermission(permissions.taxesDelete), async (request, response, next) => {
  try {
    await removeTax(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});