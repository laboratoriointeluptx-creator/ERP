import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { issueInvoiceFromSalesOrder, registerPayment } from '../services/finance.service.js';
import { createPaymentSchema, issueInvoiceSchema } from '../validators/finance.schemas.js';

export const invoiceRouter = Router();
invoiceRouter.use(requireAuthentication);
invoiceRouter.post('/', requirePermission(permissions.invoicesIssue), async (request, response, next) => {
  try {
    const result = await issueInvoiceFromSalesOrder(request.auth!.organizationId, request.auth!.sub, issueInvoiceSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});

export const paymentRouter = Router();
paymentRouter.use(requireAuthentication);
paymentRouter.post('/', requirePermission(permissions.paymentsCreate), async (request, response, next) => {
  try {
    const result = await registerPayment(request.auth!.organizationId, request.auth!.sub, createPaymentSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});
