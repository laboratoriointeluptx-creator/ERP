import request from 'supertest';
import { app } from '../src/app.js';

describe('purchase orders', () => {
  it('requires authentication to create purchase orders', async () => {
    const response = await request(app).post('/api/v1/purchase-orders').send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('requires authentication to receive a purchase order', async () => {
    const response = await request(app)
      .post('/api/v1/purchase-orders/6a0000000000000000000001/receipts')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

});
