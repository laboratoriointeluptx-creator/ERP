import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getBudgets, modifyBudget, registerBudget, approveBudgetById, activateBudgetById, closeBudgetById, removeBudget } from '../services/budget.service.js';
import { approveBudgetSchema, budgetQuerySchema, createBudgetSchema, updateBudgetSchema } from '../validators/budget.schemas.js';

export const budgetRouter = Router();
budgetRouter.use(requireAuthentication);

budgetRouter.get('/', requirePermission(permissions.budgetsRead), async (request, response, next) => {
  try {
    const query = budgetQuerySchema.parse(request.query);
    const result = await getBudgets(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

budgetRouter.post('/', requirePermission(permissions.budgetsCreate), async (request, response, next) => {
  try {
    const budget = await registerBudget(request.auth!.organizationId, createBudgetSchema.parse(request.body));
    const body: ApiSuccess<typeof budget> = { success: true, data: budget };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

budgetRouter.patch('/:id', requirePermission(permissions.budgetsUpdate), async (request, response, next) => {
  try {
    const budget = await modifyBudget(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateBudgetSchema.parse(request.body), request.ip);
    response.json({ success: true, data: budget } satisfies ApiSuccess<typeof budget>);
  } catch (error: unknown) { next(error); }
});

budgetRouter.post('/:id/approve', requirePermission(permissions.budgetsApprove), async (request, response, next) => {
  try {
    const budget = await approveBudgetById(request.auth!.organizationId, request.auth!.sub, String(request.params.id), approveBudgetSchema.parse(request.body), request.ip);
    response.json({ success: true, data: budget } satisfies ApiSuccess<typeof budget>);
  } catch (error: unknown) { next(error); }
});

budgetRouter.post('/:id/activate', requirePermission(permissions.budgetsApprove), async (request, response, next) => {
  try {
    const budget = await activateBudgetById(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.json({ success: true, data: budget } satisfies ApiSuccess<typeof budget>);
  } catch (error: unknown) { next(error); }
});

budgetRouter.post('/:id/close', requirePermission(permissions.budgetsApprove), async (request, response, next) => {
  try {
    const budget = await closeBudgetById(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.json({ success: true, data: budget } satisfies ApiSuccess<typeof budget>);
  } catch (error: unknown) { next(error); }
});

budgetRouter.delete('/:id', requirePermission(permissions.budgetsDelete), async (request, response, next) => {
  try {
    await removeBudget(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});