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
import { CreditMemoModel } from '../models/credit-memo.model.js';
import { InventoryReturnModel } from '../../inventory/models/inventory-return.model.js';
import { CustomerRefundModel } from '../models/customer-refund.model.js';
import type {
  CreateCreditMemoInput, CreatePaymentInput, CreateSupplierInvoiceInput, CreateSupplierPaymentInput,
  CreateCustomerRefundInput, CreditMemoQuery, CustomerRefundQuery, InvoiceQuery, IssueInvoiceInput, PaymentQuery, SupplierInvoiceQuery, SupplierPaymentQuery,
} from '../validators/finance.schemas.js';

export const calculateInvoiceTotals = (lines: Array<{ quantity: string; unitPrice: string }>) => {
  const subtotal = lines.reduce((sum, line) => addDecimal(sum, multiplyDecimal(line.quantity, line.unitPrice)), '0');
  return { subtotal, taxTotal: '0', total: subtotal };
};

const amountDueAfterSettlements = (total: string, paid: string, credits: string): string => {
  const settled = addDecimal(paid, credits);
  return isGreaterThan(settled, total) ? '0' : subtractDecimal(total, settled);
};

export const calculateInvoicePayment = (total: string, paid: string, amount: string, credits = '0') => {
  const balance = amountDueAfterSettlements(total, paid, credits);
  if (isGreaterThan(amount, balance)) throw new HttpError(409, 'PAYMENT_EXCEEDS_BALANCE', 'Payment exceeds the invoice balance');
  const nextPaid = addDecimal(paid, amount);
  const nextBalance = amountDueAfterSettlements(total, nextPaid, credits);
  return { paid: nextPaid, balance: nextBalance, status: nextBalance === '0' ? 'PAID' as const : 'PARTIALLY_PAID' as const };
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
  const creditMemos = invoiceIds.length ? await CreditMemoModel.find({ organizationId, invoiceId: { $in: invoiceIds } }).exec() : [];
  const refunds = invoiceIds.length ? await CustomerRefundModel.find({ organizationId, invoiceId: { $in: invoiceIds } }).exec() : [];
  const paidByInvoice = new Map<string, string>();
  const creditsByInvoice = new Map<string, string>();
  const refundsByInvoice = new Map<string, string>();
  for (const payment of payments) {
    const key = String(payment.invoiceId);
    paidByInvoice.set(key, addDecimal(paidByInvoice.get(key) ?? '0', payment.amount));
  }
  for (const credit of creditMemos) {
    const key = String(credit.invoiceId);
    creditsByInvoice.set(key, addDecimal(creditsByInvoice.get(key) ?? '0', credit.total));
  }
  for (const refund of refunds) {
    const key = String(refund.invoiceId);
    refundsByInvoice.set(key, addDecimal(refundsByInvoice.get(key) ?? '0', refund.amount));
  }
  const data = invoices.map((invoice) => {
    const paidAmount = paidByInvoice.get(String(invoice._id)) ?? '0';
    const creditedAmount = creditsByInvoice.get(String(invoice._id)) ?? '0';
    const settled = addDecimal(paidAmount, creditedAmount);
    const excess = isGreaterThan(settled, invoice.total) ? subtractDecimal(settled, invoice.total) : '0';
    const refundedAmount = refundsByInvoice.get(String(invoice._id)) ?? '0';
    return {
      ...invoice.toObject(), paidAmount, creditedAmount,
      balanceDue: amountDueAfterSettlements(invoice.total, paidAmount, creditedAmount),
      refundedAmount,
      customerCreditAmount: isGreaterThan(refundedAmount, excess) ? '0' : subtractDecimal(excess, refundedAmount),
    };
  });
  return { data, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
};

export const listCreditMemos = async (organizationId: string, query: CreditMemoQuery) => {
  const filter = { organizationId, ...(query.invoiceId ? { invoiceId: query.invoiceId } : {}) };
  const [data, total] = await Promise.all([
    CreditMemoModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    CreditMemoModel.countDocuments(filter).exec(),
  ]);
  return { data, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
};

export const listCustomerRefunds = async (organizationId: string, query: CustomerRefundQuery) => {
  const filter = { organizationId, ...(query.invoiceId ? { invoiceId: query.invoiceId } : {}), ...(query.paymentId ? { paymentId: query.paymentId } : {}) };
  const [data, total] = await Promise.all([
    CustomerRefundModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    CustomerRefundModel.countDocuments(filter).exec(),
  ]);
  return { data, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
};

export const listPayments = async (organizationId: string, query: PaymentQuery) => {
  const filter = {
    organizationId,
    ...(query.invoiceId ? { invoiceId: query.invoiceId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [payments, total] = await Promise.all([
    PaymentModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    PaymentModel.countDocuments(filter).exec(),
  ]);
  const paymentIds = payments.map((payment) => payment._id);
  const refunds = paymentIds.length ? await CustomerRefundModel.find({ organizationId, paymentId: { $in: paymentIds } }).exec() : [];
  const refundedByPayment = new Map<string, string>();
  for (const refund of refunds) {
    const key = String(refund.paymentId);
    refundedByPayment.set(key, addDecimal(refundedByPayment.get(key) ?? '0', refund.amount));
  }
  const data = payments.map((payment) => {
    const refundedAmount = refundedByPayment.get(String(payment._id)) ?? '0';
    const netAmount = isGreaterThan(refundedAmount, payment.amount) ? '0' : subtractDecimal(payment.amount, refundedAmount);
    return { ...payment.toObject(), refundedAmount, netAmount };
  });
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

export const registerCreditMemo = async (organizationId: string, userId: string, input: CreateCreditMemoInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const returned = await InventoryReturnModel.findOne({ _id: input.inventoryReturnId, organizationId, sourceType: 'SALE_ORDER' }).session(session).exec();
      if (!returned) throw new HttpError(404, 'SALES_RETURN_NOT_FOUND', 'Sales return not found');
      const invoice = await InvoiceModel.findOne({ organizationId, salesOrderId: returned.sourceDocumentId }).session(session).exec();
      if (!invoice || invoice.status === 'DRAFT' || invoice.status === 'CANCELLED') throw new HttpError(409, 'INVOICE_NOT_CREDITABLE', 'Sales return must be linked to an issued invoice');
      const existing = await CreditMemoModel.findOne({ organizationId, inventoryReturnId: returned._id }).session(session).exec();
      if (existing) throw new HttpError(409, 'SALES_RETURN_ALREADY_CREDITED', 'This sales return already has a credit memo');

      const priorMemos = await CreditMemoModel.find({ organizationId, invoiceId: invoice._id }).session(session).exec();
      const creditedQuantities = new Map<string, string>();
      for (const memo of priorMemos) {
        for (const line of memo.lines) {
          const productId = String(line.productId).toLowerCase();
          creditedQuantities.set(productId, addDecimal(creditedQuantities.get(productId) ?? '0', line.quantity));
        }
      }
      const invoiceLines = new Map(invoice.lines.map((line) => [String(line.productId).toLowerCase(), line]));
      const lines = [];
      for (const returnedLine of returned.lines) {
        const productId = String(returnedLine.productId).toLowerCase();
        const invoiceLine = invoiceLines.get(productId);
        if (!invoiceLine) throw new HttpError(409, 'CREDIT_MEMO_PRODUCT_MISSING', 'Returned product is not present on the invoice');
        const previouslyCredited = creditedQuantities.get(productId) ?? '0';
        const remaining = isGreaterThan(previouslyCredited, invoiceLine.quantity) ? '0' : subtractDecimal(invoiceLine.quantity, previouslyCredited);
        if (isGreaterThan(returnedLine.quantity, remaining)) throw new HttpError(409, 'CREDIT_MEMO_QUANTITY_EXCEEDED', 'Credited quantity exceeds the invoiced quantity remaining');
        lines.push({ productId: invoiceLine.productId, description: invoiceLine.description, quantity: returnedLine.quantity, unitPrice: invoiceLine.unitPrice, amount: multiplyDecimal(returnedLine.quantity, invoiceLine.unitPrice) });
      }
      const amount = lines.reduce((sum, line) => addDecimal(sum, line.amount), '0');
      if (amount === '0') throw new HttpError(409, 'EMPTY_CREDIT_MEMO', 'Credit memo amount must be greater than zero');
      const [creditMemo] = await CreditMemoModel.create([{
        organizationId, invoiceId: invoice._id, inventoryReturnId: returned._id, number: input.number,
        reason: input.reason, lines, subtotal: amount, taxTotal: '0', total: amount, currency: invoice.currency, createdBy: userId,
      }], { session });
      if (!creditMemo) throw new Error('Credit memo creation returned no document');

      const confirmedPayments = await PaymentModel.find({ organizationId, invoiceId: invoice._id, status: 'CONFIRMED' }).session(session).exec();
      const paid = confirmedPayments.reduce((sum, payment) => addDecimal(sum, payment.amount), '0');
      const credited = addDecimal(priorMemos.reduce((sum, memo) => addDecimal(sum, memo.total), '0'), amount);
      invoice.status = amountDueAfterSettlements(invoice.total, paid, credited) === '0' ? 'PAID' : paid === '0' ? 'ISSUED' : 'PARTIALLY_PAID';
      await invoice.save({ session });
      await recordAuditEvent({ organizationId, userId, action: 'credit-memo.issued', module: 'finance', entity: 'CreditMemo', entityId: String(creditMemo._id), ...(ip ? { ip } : {}), after: { number: creditMemo.number, invoiceId: String(invoice._id), inventoryReturnId: String(returned._id), amount: creditMemo.total, currency: creditMemo.currency } }, session);
      result = creditMemo;
    });
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) throw new HttpError(409, 'CREDIT_MEMO_CONFLICT', 'Credit memo number or sales return has already been used');
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
      const creditMemos = await CreditMemoModel.find({ organizationId, invoiceId: invoice._id }).session(session).exec();
      const credited = creditMemos.reduce((sum, credit) => addDecimal(sum, credit.total), '0');
      const paymentState = calculateInvoicePayment(invoice.total, paid, input.amount, credited);
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

export const registerCustomerRefund = async (organizationId: string, userId: string, input: CreateCustomerRefundInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const payment = await PaymentModel.findOne({ _id: input.paymentId, organizationId, status: 'CONFIRMED' }).session(session).exec();
      if (!payment) throw new HttpError(404, 'CONFIRMED_PAYMENT_NOT_FOUND', 'Confirmed payment not found');
      const invoice = await InvoiceModel.findOne({ _id: payment.invoiceId, organizationId }).session(session).exec();
      if (!invoice) throw new HttpError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
      const creditMemo = await CreditMemoModel.findOne({ _id: input.creditMemoId, organizationId, invoiceId: invoice._id }).session(session).exec();
      if (!creditMemo) throw new HttpError(404, 'CREDIT_MEMO_NOT_FOUND', 'Credit memo for this invoice not found');

      const [confirmedPayments, creditMemos, priorRefunds] = await Promise.all([
        PaymentModel.find({ organizationId, invoiceId: invoice._id, status: 'CONFIRMED' }).session(session).exec(),
        CreditMemoModel.find({ organizationId, invoiceId: invoice._id }).session(session).exec(),
        CustomerRefundModel.find({ organizationId, invoiceId: invoice._id }).session(session).exec(),
      ]);
      const paid = confirmedPayments.reduce((sum, item) => addDecimal(sum, item.amount), '0');
      const credited = creditMemos.reduce((sum, item) => addDecimal(sum, item.total), '0');
      const refunded = priorRefunds.reduce((sum, item) => addDecimal(sum, item.amount), '0');
      const settled = addDecimal(paid, credited);
      const totalCustomerCredit = isGreaterThan(settled, invoice.total) ? subtractDecimal(settled, invoice.total) : '0';
      if (isGreaterThan(refunded, totalCustomerCredit)) throw new HttpError(409, 'CUSTOMER_CREDIT_INVALID', 'Previous refunds exceed the customer credit');
      const remainingCustomerCredit = subtractDecimal(totalCustomerCredit, refunded);
      const refundedForPayment = priorRefunds.filter((item) => String(item.paymentId) === String(payment._id)).reduce((sum, item) => addDecimal(sum, item.amount), '0');
      const refundedForCredit = priorRefunds.filter((item) => String(item.creditMemoId) === String(creditMemo._id)).reduce((sum, item) => addDecimal(sum, item.amount), '0');
      const remainingPayment = isGreaterThan(refundedForPayment, payment.amount) ? '0' : subtractDecimal(payment.amount, refundedForPayment);
      const remainingCreditMemo = isGreaterThan(refundedForCredit, creditMemo.total) ? '0' : subtractDecimal(creditMemo.total, refundedForCredit);
      if (isGreaterThan(input.amount, remainingCustomerCredit) || isGreaterThan(input.amount, remainingPayment) || isGreaterThan(input.amount, remainingCreditMemo)) {
        throw new HttpError(409, 'REFUND_EXCEEDS_AVAILABLE_CREDIT', 'Refund exceeds the refundable credit, payment amount, or credit memo balance');
      }

      const revision = invoice.financialRevision ?? 0;
      const lock = await InvoiceModel.updateOne(
        { _id: invoice._id, organizationId, $or: [{ financialRevision: revision }, { financialRevision: { $exists: false } }] },
        { $inc: { financialRevision: 1 } },
        { session },
      ).exec();
      if (lock.matchedCount !== 1) throw new HttpError(409, 'REFUND_CONCURRENT_CONFLICT', 'Invoice financial balances changed; reload and try the refund again');

      const [refund] = await CustomerRefundModel.create([{
        organizationId, invoiceId: invoice._id, paymentId: payment._id, creditMemoId: creditMemo._id,
        amount: input.amount, method: input.method, reference: input.reference, reason: input.reason, createdBy: userId,
      }], { session });
      if (!refund) throw new Error('Customer refund creation returned no document');
      await recordAuditEvent({ organizationId, userId, action: 'customer-refund.created', module: 'finance', entity: 'CustomerRefund', entityId: String(refund._id), ...(ip ? { ip } : {}), after: { invoiceId: String(invoice._id), paymentId: String(payment._id), creditMemoId: String(creditMemo._id), amount: refund.amount, method: refund.method, reason: refund.reason } }, session);
      result = refund;
    });
    return result;
  } finally { await session.endSession(); }
};
