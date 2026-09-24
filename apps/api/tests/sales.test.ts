import request from 'supertest';
import { app } from '../src/app.js';
import { availableStock, releaseReservation } from '../src/modules/sales/services/sales-order.service.js';
import { confirmSalesOrderSchema, createSalesOrderSchema } from '../src/modules/sales/validators/sales-order.schemas.js';

describe('sales orders', () => {
  it('requires authentication to create sales orders', async () => {
    const response = await request(app).post('/api/v1/sales-orders').send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('requires authentication to confirm and reserve a sales order', async () => {
    const response = await request(app)
      .post('/api/v1/sales-orders/6a0000000000000000000001/confirm')
      .send({ warehouseId: '6a0000000000000000000002' });

    expect(response.status).toBe(401);
  });

  it('requires authentication to cancel a sales order', async () => {
    const response = await request(app).post('/api/v1/sales-orders/6a0000000000000000000001/cancel').send({});

    expect(response.status).toBe(401);
  });

  it('calculates available stock using fixed precision', () => {
    expect(availableStock('4.5', '1.25')).toBe('3.25');
    expect(() => availableStock('1', '1.0001')).toThrow('Reserved quantity exceeds on-hand inventory');
    expect(releaseReservation('2.5', '1.25')).toBe('1.25');
    expect(() => releaseReservation('1', '1.0001')).toThrow('Reserved quantity is lower than the sales order quantity');
  });

  it('validates unique sales order lines and warehouse confirmation input', () => {
    const customerId = '6a0000000000000000000001';
    const productId = '6a0000000000000000000002';
    const order = {
      code: 'SO-1',
      customerId,
      lines: [
        { productId, quantity: '1', unitPrice: '10' },
        { productId, quantity: '2', unitPrice: '10' },
      ],
    };
    expect(createSalesOrderSchema.safeParse(order).success).toBe(false);
    expect(confirmSalesOrderSchema.safeParse({ warehouseId: productId }).success).toBe(true);
    expect(confirmSalesOrderSchema.safeParse({ warehouseId: 'invalid' }).success).toBe(false);
  });
});
