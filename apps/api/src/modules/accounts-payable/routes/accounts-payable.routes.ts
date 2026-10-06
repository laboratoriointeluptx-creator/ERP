import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getAccountsPayable, generateAPAgingReport } from '../services/accounts-payable.service.js';
import { apAgingReportSchema, apQuerySchema } from '../validators/accounts-payable.schemas.js';

export const accountsPayableRouter = Router();
accountsPayableRouter.use(requireAuthentication);

accountsPayableRouter.get('/', requirePermission(permissions.accountsPayableRead), async (request, response, next) => {
  try {
    const query = apQuerySchema.parse(request.query);
    const result = await getAccountsPayable(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

accountsPayableRouter.get('/aging', requirePermission(permissions.accountsPayableRead), async (request, response, next) => {
  try {
    const input = apAgingReportSchema.parse(request.query);
    const report = await generateAPAgingReport(request.auth!.organizationId, input);
    const body: ApiSuccess<typeof report> = { success: true, data: report };
    response.json(body);
  } catch (error: unknown) { next(error); }
});