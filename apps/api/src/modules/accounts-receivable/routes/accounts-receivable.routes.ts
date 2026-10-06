import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getAccountsReceivable, generateAgingReport } from '../services/accounts-receivable.service.js';
import { agingReportSchema, arQuerySchema } from '../validators/accounts-receivable.schemas.js';

export const accountsReceivableRouter = Router();
accountsReceivableRouter.use(requireAuthentication);

accountsReceivableRouter.get('/', requirePermission(permissions.accountsReceivableRead), async (request, response, next) => {
  try {
    const query = arQuerySchema.parse(request.query);
    const result = await getAccountsReceivable(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

accountsReceivableRouter.get('/aging', requirePermission(permissions.accountsReceivableRead), async (request, response, next) => {
  try {
    const input = agingReportSchema.parse(request.query);
    const report = await generateAgingReport(request.auth!.organizationId, input);
    const body: ApiSuccess<typeof report> = { success: true, data: report };
    response.json(body);
  } catch (error: unknown) { next(error); }
});