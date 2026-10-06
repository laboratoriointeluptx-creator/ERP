import request from 'supertest';
import { app } from '../src/app.js';
import { productionOrderQuerySchema } from '../src/modules/production-orders/validators/production-order.schemas.js';

describe('production-orders', () => {
  it('requires authentication to list production orders', async () => {
    const response = await request(app).get('/api/v1/production-orders');
    expect(response.status).toBe(401);
  });

  it('requires authentication to create a production order', async () => {
    const response = await request(app).post('/api/v1/production-orders').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(productionOrderQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(productionOrderQuerySchema.parse({ status: 'PLANNED', page: '2' })).toEqual({ page: 2, limit: 25, status: 'PLANNED' });
    expect(productionOrderQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(productionOrderQuerySchema.safeParse({ status: 'INVALID' }).success).toBe(false);
  });
});