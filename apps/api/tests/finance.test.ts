import request from 'supertest';
import { app } from '../src/app.js';
import { calculateInvoicePayment, calculateInvoiceTotals } from '../src/modules/finance/services/finance.service.js';

describe('finance', () => {
  it('requires authentication to issue invoices and register payments', async () => {
    const invoice = await request(app).post('/api/v1/invoices').send({});
    const payment = await request(app).post('/api/v1/payments').send({});
    expect(invoice.status).toBe(401);
    expect(payment.status).toBe(401);
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
});
