import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import {
  issueInvoiceFromSalesOrder, listInvoices, listPayments, listSupplierInvoices, listSupplierPayments,
  listCreditMemos, listCustomerRefunds, registerCreditMemo, registerCustomerRefund, registerPayment, registerSupplierInvoice, registerSupplierPayment,
} from '../services/finance.service.js';
import {
  createCreditMemoSchema, creditMemoQuerySchema, createCustomerRefundSchema, customerRefundQuerySchema, createPaymentSchema, createSupplierInvoiceSchema, createSupplierPaymentSchema, invoiceQuerySchema,
  issueInvoiceSchema, paymentQuerySchema, supplierInvoiceQuerySchema, supplierPaymentQuerySchema,
} from '../validators/finance.schemas.js';

export const invoiceRouter = Router();
invoiceRouter.use(requireAuthentication);
invoiceRouter.get('/', requirePermission(permissions.invoicesRead), async (request, response, next) => {
  try {
    const result = await listInvoices(request.auth!.organizationId, invoiceQuerySchema.parse(request.query));
    response.json({ success: true, data: result.data, meta: result.meta } satisfies ApiSuccess<typeof result.data>);
  } catch (error: unknown) { next(error); }
});

export const creditMemoRouter = Router();
creditMemoRouter.use(requireAuthentication);
creditMemoRouter.get('/', requirePermission(permissions.creditMemosRead), async (request, response, next) => {
  try {
    const result = await listCreditMemos(request.auth!.organizationId, creditMemoQuerySchema.parse(request.query));
    const data = { items: result.data, total: result.meta.total };
    response.json({ success: true, data, meta: result.meta } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});

export const customerRefundRouter = Router();
customerRefundRouter.use(requireAuthentication);
customerRefundRouter.get('/', requirePermission(permissions.customerRefundsRead), async (request, response, next) => {
  try {
    const result = await listCustomerRefunds(request.auth!.organizationId, customerRefundQuerySchema.parse(request.query));
    const data = { items: result.data, total: result.meta.total };
    response.json({ success: true, data, meta: result.meta } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});
customerRefundRouter.post('/', requirePermission(permissions.customerRefundsCreate), async (request, response, next) => {
  try {
    const result = await registerCustomerRefund(request.auth!.organizationId, request.auth!.sub, createCustomerRefundSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});
creditMemoRouter.post('/', requirePermission(permissions.creditMemosCreate), async (request, response, next) => {
  try {
    const result = await registerCreditMemo(request.auth!.organizationId, request.auth!.sub, createCreditMemoSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});
invoiceRouter.post('/', requirePermission(permissions.invoicesIssue), async (request, response, next) => {
  try {
    const result = await issueInvoiceFromSalesOrder(request.auth!.organizationId, request.auth!.sub, issueInvoiceSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});

export const paymentRouter = Router();
paymentRouter.use(requireAuthentication);
paymentRouter.get('/', requirePermission(permissions.paymentsRead), async (request, response, next) => {
  try {
    const result = await listPayments(request.auth!.organizationId, paymentQuerySchema.parse(request.query));
    response.json({ success: true, data: result.data, meta: result.meta } satisfies ApiSuccess<typeof result.data>);
  } catch (error: unknown) { next(error); }
});

export const supplierInvoiceRouter = Router();
supplierInvoiceRouter.use(requireAuthentication);
supplierInvoiceRouter.get('/', requirePermission(permissions.supplierInvoicesRead), async (request, response, next) => {
  try {
    const result = await listSupplierInvoices(request.auth!.organizationId, supplierInvoiceQuerySchema.parse(request.query));
    response.json({ success: true, data: result.data, meta: result.meta } satisfies ApiSuccess<typeof result.data>);
  } catch (error: unknown) { next(error); }
});
supplierInvoiceRouter.post('/', requirePermission(permissions.supplierInvoicesCreate), async (request, response, next) => {
  try {
    const result = await registerSupplierInvoice(request.auth!.organizationId, request.auth!.sub, createSupplierInvoiceSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});

export const supplierPaymentRouter = Router();
supplierPaymentRouter.use(requireAuthentication);
supplierPaymentRouter.get('/', requirePermission(permissions.supplierPaymentsRead), async (request, response, next) => {
  try {
    const result = await listSupplierPayments(request.auth!.organizationId, supplierPaymentQuerySchema.parse(request.query));
    response.json({ success: true, data: result.data, meta: result.meta } satisfies ApiSuccess<typeof result.data>);
  } catch (error: unknown) { next(error); }
});
supplierPaymentRouter.post('/', requirePermission(permissions.supplierPaymentsCreate), async (request, response, next) => {
  try {
    const result = await registerSupplierPayment(request.auth!.organizationId, request.auth!.sub, createSupplierPaymentSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});
paymentRouter.post('/', requirePermission(permissions.paymentsCreate), async (request, response, next) => {
  try {
    const result = await registerPayment(request.auth!.organizationId, request.auth!.sub, createPaymentSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});
