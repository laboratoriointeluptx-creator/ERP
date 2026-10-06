import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getAccounts, getAccountHierarchy, modifyAccount, registerAccount, removeAccount } from '../services/account.service.js';
import { accountQuerySchema, createAccountSchema, updateAccountSchema } from '../validators/account.schemas.js';

export const accountRouter = Router();
accountRouter.use(requireAuthentication);

accountRouter.get('/', requirePermission(permissions.chartOfAccountsRead), async (request, response, next) => {
  try {
    const query = accountQuerySchema.parse(request.query);
    const result = await getAccounts(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

accountRouter.get('/hierarchy', requirePermission(permissions.chartOfAccountsRead), async (request, response, next) => {
  try {
    const tree = await getAccountHierarchy(request.auth!.organizationId);
    const body: ApiSuccess<typeof tree> = { success: true, data: tree };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

accountRouter.post('/', requirePermission(permissions.chartOfAccountsCreate), async (request, response, next) => {
  try {
    const account = await registerAccount(request.auth!.organizationId, createAccountSchema.parse(request.body));
    const body: ApiSuccess<typeof account> = { success: true, data: account };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

accountRouter.patch('/:id', requirePermission(permissions.chartOfAccountsUpdate), async (request, response, next) => {
  try {
    const account = await modifyAccount(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateAccountSchema.parse(request.body), request.ip);
    response.json({ success: true, data: account } satisfies ApiSuccess<typeof account>);
  } catch (error: unknown) { next(error); }
});

accountRouter.delete('/:id', requirePermission(permissions.chartOfAccountsDelete), async (request, response, next) => {
  try {
    await removeAccount(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});