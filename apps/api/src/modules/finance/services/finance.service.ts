import mongoose from 'mongoose';
import { addDecimal, isGreaterThan, multiplyDecimal, subtractDecimal } from '../../../shared/decimal.js';
import { HttpError } from '../../../shared/http.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { SalesOrderModel } from '../../sales/models/sales-order.model.js';
import { ProductModel } from '../../products/models/product.model.js';
import { InvoiceModel } from '../models/invoice.model.js';
import { PaymentModel } from '../models/payment.model.js';
import { PurchaseOrderModel } from '../../purchases/models/purchase-order.model.js';
import { SupplierInvoiceModel } from '../models/supplier-invoice.model.js';
import { SupplierPaymentModel } from '../models/supplier-payment.model.js';
import type {
  CreatePaymentInput, CreateSupplierInvoiceInput, CreateSupplierPaymentInput,
  InvoiceQuery, IssueInvoiceInput, PaymentQuery, SupplierInvoiceQuery, SupplierPaymentQuery,
} from '../validators/finance.schemas.js';

export const calculateInvoiceTotals = (lines: Array<{ quantity: string; unitPrice: string }>) => {
  const subtotal = lines.reduce((sum, line) => addDecimal(sum, multiplyDecimal(line.quantity, line.unitPrice)), '0');
  return { subtotal, taxTotal: '0', total: subtotal };
};

export const calculateInvoicePayment = (total: string, paid: string, amount: string) => {
  const balance = subtractDecimal(total, paid);
  if (isGreaterThan(amount, balance)) throw new HttpError(409, 'PAYMENT_EXCEEDS_BALANCE', 'Payment exceeds the invoice balance');
  const nextPaid = addDecimal(paid, amount);
  return { paid: nextPaid, balance: subtractDecimal(total, nextPaid), status: nextPaid === total ? 'PAID' as const : 'PARTIALLY_PAID' as const };
};

export const calculatePayablePayment = (amountDue: string, paid: string, amount: string) => {
  const balance = subtractDecimal(amountDue, paid);
  if (isGreaterThan(amount, balance)) throw new HttpError(409, 'PAYMENT_EXCEEDS_PAYABLE', 'Payment exceeds the supplier invoice balance');
  const nextPaid = addDecimal(paid, amount);
  return { paid: nextPaid, balance: subtractDecimal(amountDue, nextPaid), status: nextPaid === amountDue ? 'PAID' as const : 'PARTIALLY_PAID' as const };
};

export const listInvoices = async (organizationId: string, query: InvoiceQuery) => {
  const filter = {
    organizationId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
  };
  const [invoices, total] = await Promise.all([
    InvoiceModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    InvoiceModel.countDocuments(filter).exec(),
  ]);
  const invoiceIds = invoices.map((invoice) => invoice._id);
  const payments = invoiceIds.length
    ? await PaymentModel.find({ organizationId, invoiceId: { $in: invoiceIds }, status: 'CONFIRMED' }).exec()
    : [];
  const paidByInvoice = new Map<string, string>();
  for (const payment of payments) {
    const key = String(payment.invoiceId);
    paidByInvoice.set(key, addDecimal(paidByInvoice.get(key) ?? '0', payment.amount));
  }
  const data = invoices.map((invoice) => {
    const paidAmount = paidByInvoice.get(String(invoice._id)) ?? '0';
    return { ...invoice.toObject(), paidAmount, balanceDue: subtractDecimal(invoice.total, paidAmount) };
  });
  return { data, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
};

export const listPayments = async (organizationId: string, query: PaymentQuery) => {
  const filter = {
    organizationId,
    ...(query.invoiceId ? { invoiceId: query.invoiceId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [data, total] = await Promise.all([
    PaymentModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    PaymentModel.countDocuments(filter).exec(),
  ]);
  return { data, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
};

export const listSupplierInvoices = async (organizationId: string, query: SupplierInvoiceQuery) => {
  const filter = {
    organizationId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
  };
  const [invoices, total] = await Promise.all([
    SupplierInvoiceModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    SupplierInvoiceModel.countDocuments(filter).exec(),
  ]);
  const invoiceIds = invoices.map((invoice) => invoice._id);
  const payments = invoiceIds.length
    ? await SupplierPaymentModel.find({ organizationId, supplierInvoiceId: { $in: invoiceIds }, status: 'CONFIRMED' }).exec()
    : [];
  const paidByInvoice = new Map<string, string>();
  for (const payment of payments) {
    const key = String(payment.supplierInvoiceId);
    paidByInvoice.set(key, addDecimal(paidByInvoice.get(key) ?? '0', payment.amount));
  }
  const data = invoices.map((invoice) => {
    const paidAmount = paidByInvoice.get(String(invoice._id)) ?? '0';
    return { ...invoice.toObject(), paidAmount, balanceDue: subtractDecimal(invoice.amount, paidAmount) };
  });
  return { data, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
};

export const listSupplierPayments = async (organizationId: string, query: SupplierPaymentQuery) => {
  const filter = {
    organizationId,
    ...(query.supplierInvoiceId ? { supplierInvoiceId: query.supplierInvoiceId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [data, total] = await Promise.all([
    SupplierPaymentModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    SupplierPaymentModel.countDocuments(filter).exec(),
  ]);
  return { data, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
};

export const registerSupplierInvoice = async (organizationId: string, userId: string, input: CreateSupplierInvoiceInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const order = await PurchaseOrderModel.findOne({
        _id: input.purchaseOrderId, organizationId, status: { $in: ['SENT', 'PARTIALLY_RECEIVED', 'RECEIVED'] },
      }).session(session).exec();
      if (!order) throw new HttpError(409, 'PURCHASE_ORDER_NOT_BILLABLE', 'Supplier invoices require a sent, non-cancelled purchase order');
      const [invoice] = await SupplierInvoiceModel.create([{
        organizationId,
        supplierId: order.supplierId,
        purchaseOrderId: order._id,
        number: input.number,
        amount: input.amount,
        currency: order.currency,
        status: 'OPEN',
      }], { session });
      if (!invoice) throw new Error('Supplier invoice creation returned no document');
      await recordAuditEvent({
        organizationId, userId, action: 'supplier-invoice.created', module: 'finance', entity: 'SupplierInvoice', entityId: String(invoice._id),
        ...(ip ? { ip } : {}), after: { number: invoice.number, amount: invoice.amount, purchaseOrderId: String(order._id) },
      }, session);
      result = invoice;
    });
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'SUPPLIER_INVOICE_EXISTS', 'Supplier invoice number already exists for this supplier');
    }
    throw error;
  } finally { await session.endSession(); }
};

export const registerSupplierPayment = async (organizationId: string, userId: string, input: CreateSupplierPaymentInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const invoice = await SupplierInvoiceModel.findOne({ _id: input.supplierInvoiceId, organizationId }).session(session).exec();
      if (!invoice) throw new HttpError(404, 'SUPPLIER_INVOICE_NOT_FOUND', 'Supplier invoice not found');
      if (invoice.status !== 'OPEN' && invoice.status !== 'PARTIALLY_PAID') {
        throw new HttpError(409, 'SUPPLIER_INVOICE_NOT_PAYABLE', 'Supplier invoice is not open for payment');
      }
      const priorPayments = await SupplierPaymentModel.find({ organizationId, supplierInvoiceId: invoice._id, status: 'CONFIRMED' }).session(session).exec();
      const paid = priorPayments.reduce((sum, payment) => addDecimal(sum, payment.amount), '0');
      const state = calculatePayablePayment(invoice.amount, paid, input.amount);
      const [payment] = await SupplierPaymentModel.create([{
        organizationId, supplierId: invoice.supplierId, supplierInvoiceId: invoice._id,
        amount: input.amount, currency: invoice.currency, method: input.method, reference: input.reference, status: 'CONFIRMED',
      }], { session });
      if (!payment) throw new Error('Supplier payment creation returned no document');
      invoice.status = state.status;
      await invoice.save({ session });
      await recordAuditEvent({
        organizationId, userId, action: 'supplier-payment.confirmed', module: 'finance', entity: 'SupplierPayment', entityId: String(payment._id),
        ...(ip ? { ip } : {}), after: { supplierInvoiceId: String(invoice._id), amount: payment.amount, status: invoice.status },
      }, session);
      result = payment;
    });
    return result;
  } finally { await session.endSession(); }
};

export const issueInvoiceFromSalesOrder = async (organizationId: string, userId: string, input: IssueInvoiceInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const order = await SalesOrderModel.findOne({ _id: input.salesOrderId, organizationId, status: 'COMPLETED' }).session(session).exec();
      if (!order) throw new HttpError(404, 'COMPLETED_SALES_ORDER_NOT_FOUND', 'Completed sales order not found');
      const existing = await InvoiceModel.findOne({ organizationId, salesOrderId: order._id }).session(session).exec();
      if (existing) throw new HttpError(409, 'SALES_ORDER_ALREADY_INVOICED', 'Sales order already has an invoice');

      const products = await ProductModel.find({ _id: { $in: order.lines.map((line) => line.productId) }, organizationId }).session(session).exec();
      if (products.length !== order.lines.length) throw new HttpError(409, 'INVOICE_PRODUCT_MISSING', 'One or more sales order products are unavailable');
      const productNames = new Map(products.map((product) => [String(product._id), product.name]));
      const lines = order.lines.map((line) => ({
        productId: line.productId,
        description: productNames.get(String(line.productId)) ?? 'Product',
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      }));
      const totals = calculateInvoiceTotals(lines);
      const [invoice] = await InvoiceModel.create([{
        organizationId,
        customerId: order.customerId,
        salesOrderId: order._id,
        number: input.number,
        status: 'ISSUED',
        lines,
        ...totals,
        currency: order.currency,
      }], { session });
      if (!invoice) throw new Error('Invoice creation returned no document');
      await recordAuditEvent({
        organizationId, userId, action: 'invoice.issued', module: 'finance', entity: 'Invoice', entityId: String(invoice._id),
        ...(ip ? { ip } : {}), after: { number: invoice.number, total: invoice.total, salesOrderId: String(order._id) },
      }, session);
      result = invoice;
    });
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'INVOICE_EXISTS', 'Invoice number or sales order invoice already exists');
    }
    throw error;
  } finally { await session.endSession(); }
};

export const registerPayment = async (organizationId: string, userId: string, input: CreatePaymentInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const invoice = await InvoiceModel.findOne({ _id: input.invoiceId, organizationId }).session(session).exec();
      if (!invoice) throw new HttpError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
      if (invoice.status !== 'ISSUED' && invoice.status !== 'PARTIALLY_PAID') {
        throw new HttpError(409, 'INVOICE_NOT_PAYABLE', 'Invoice is not open for payment');
      }
      const priorPayments = await PaymentModel.find({ organizationId, invoiceId: invoice._id, status: 'CONFIRMED' }).session(session).exec();
      const paid = priorPayments.reduce((sum, payment) => addDecimal(sum, payment.amount), '0');
      const paymentState = calculateInvoicePayment(invoice.total, paid, input.amount);
      const [payment] = await PaymentModel.create([{
        organizationId, customerId: invoice.customerId, invoiceId: invoice._id, amount: input.amount,
        currency: invoice.currency, method: input.method, reference: input.reference, status: 'CONFIRMED',
      }], { session });
      if (!payment) throw new Error('Payment creation returned no document');
      invoice.status = paymentState.status;
      await invoice.save({ session });
      await recordAuditEvent({
        organizationId, userId, action: 'payment.confirmed', module: 'finance', entity: 'Payment', entityId: String(payment._id),
        ...(ip ? { ip } : {}), after: { invoiceId: String(invoice._id), amount: payment.amount, invoiceStatus: invoice.status },
      }, session);
      result = payment;
    });
    return result;
  } finally { await session.endSession(); }
};
