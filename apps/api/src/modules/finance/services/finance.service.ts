import mongoose from 'mongoose';
import { addDecimal, isGreaterThan, multiplyDecimal, subtractDecimal } from '../../../shared/decimal.js';
import { HttpError } from '../../../shared/http.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { SalesOrderModel } from '../../sales/models/sales-order.model.js';
import { ProductModel } from '../../products/models/product.model.js';
import { InvoiceModel } from '../models/invoice.model.js';
import { PaymentModel } from '../models/payment.model.js';
import type { CreatePaymentInput, IssueInvoiceInput } from '../validators/finance.schemas.js';

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
