import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getBankAccounts, modifyBankAccount, reconcile, registerBankAccount, removeBankAccount } from '../services/bank-account.service.js';
import { bankAccountQuerySchema, createBankAccountSchema, reconciliationSchema, updateBankAccountSchema } from '../validators/bank-account.schemas.js';

export const bankAccountRouter = Router();
bankAccountRouter.use(requireAuthentication);

bankAccountRouter.get('/', requirePermission(permissions.bankingRead), async (request, response, next) => {
  try {
    const query = bankAccountQuerySchema.parse(request.query);
    const result = await getBankAccounts(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

bankAccountRouter.post('/', requirePermission(permissions.bankingManage), async (request, response, next) => {
  try {
    const account = await registerBankAccount(request.auth!.organizationId, createBankAccountSchema.parse(request.body));
    const body: ApiSuccess<typeof account> = { success: true, data: account };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

bankAccountRouter.patch('/:id', requirePermission(permissions.bankingManage), async (request, response, next) => {
  try {
    const account = await modifyBankAccount(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateBankAccountSchema.parse(request.body), request.ip);
    response.json({ success: true, data: account } satisfies ApiSuccess<typeof account>);
  } catch (error: unknown) { next(error); }
});

bankAccountRouter.delete('/:id', requirePermission(permissions.bankingManage), async (request, response, next) => {
  try {
    await removeBankAccount(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});

bankAccountRouter.post('/:id/reconcile', requirePermission(permissions.bankingReconcile), async (request, response, next) => {
  try {
    const account = await reconcile(request.auth!.organizationId, request.auth!.sub, reconciliationSchema.parse(request.body), request.ip);
    response.json({ success: true, data: account } satisfies ApiSuccess<typeof account>);
  } catch (error: unknown) { next(error); }
});