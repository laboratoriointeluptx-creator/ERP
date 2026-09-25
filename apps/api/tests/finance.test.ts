import request from 'supertest';
import { app } from '../src/app.js';
import { calculateInvoicePayment, calculateInvoiceTotals, calculatePayablePayment } from '../src/modules/finance/services/finance.service.js';

describe('finance', () => {
  it('requires authentication to issue invoices and register payments', async () => {
    const invoiceList = await request(app).get('/api/v1/invoices');
    const invoice = await request(app).post('/api/v1/invoices').send({});
    const paymentList = await request(app).get('/api/v1/payments');
    const payment = await request(app).post('/api/v1/payments').send({});
    const supplierInvoice = await request(app).get('/api/v1/supplier-invoices');
    const supplierPayment = await request(app).post('/api/v1/supplier-payments').send({});
    expect(invoiceList.status).toBe(401);
    expect(invoice.status).toBe(401);
    expect(paymentList.status).toBe(401);
    expect(payment.status).toBe(401);
    expect(supplierInvoice.status).toBe(401);
    expect(supplierPayment.status).toBe(401);
  });

  it('calculates invoice lines using fixed precision', () => {
    expect(calculateInvoiceTotals([
      { quantity: '2', unitPrice: '10.25' },
      { quantity: '0.5', unitPrice: '3.5' },
    ])).toEqual({ subtotal: '22.25', taxTotal: '0', total: '22.25' });
  });

  it('rejects overpayments and marks a fully paid invoice', () => {
    expect(calculateInvoicePayment('100', '25', '25')).toEqual({ paid: '50', balance: '50', status: 'PARTIALLY_PAID' });
    expect(calculateInvoicePayment('100', '75', '25')).toEqual({ paid: '100', balance: '0', status: 'PAID' });
    expect(() => calculateInvoicePayment('100', '90', '10.01')).toThrow('Payment exceeds the invoice balance');
  });

  it('tracks supplier payables and prevents paying more than the invoice amount', () => {
    expect(calculatePayablePayment('120', '20', '50')).toEqual({ paid: '70', balance: '50', status: 'PARTIALLY_PAID' });
    expect(calculatePayablePayment('120', '100', '20')).toEqual({ paid: '120', balance: '0', status: 'PAID' });
    expect(() => calculatePayablePayment('120', '100', '20.01')).toThrow('Payment exceeds the supplier invoice balance');
  });
});
