import request from 'supertest';
import { app } from '../src/app.js';
import { inventoryMovementQuerySchema, inventoryQuerySchema } from '../src/modules/inventory/validators/inventory.schemas.js';

describe('inventory', () => {
  it('requires authentication to list balances and movement history', async () => {
    const [balances, movements] = await Promise.all([
      request(app).get('/api/v1/inventory'),
      request(app).get('/api/v1/inventory/movements'),
    ]);

    expect(balances.status).toBe(401);
    expect(movements.status).toBe(401);
  });

  it('requires authentication to create a movement', async () => {
    const response = await request(app).post('/api/v1/inventory/movements').send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(inventoryQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(inventoryMovementQuerySchema.parse({ type: 'PURCHASE', page: '2' })).toEqual({ page: 2, limit: 25, type: 'PURCHASE' });
    expect(inventoryQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(inventoryMovementQuerySchema.safeParse({ type: 'UNKNOWN' }).success).toBe(false);
  });
});
