import request from 'supertest';
import { app } from '../src/app.js';
import { apQuerySchema } from '../src/modules/accounts-payable/validators/accounts-payable.schemas.js';

describe('accounts-payable', () => {
  it('requires authentication to list AP', async () => {
    const response = await request(app).get('/api/v1/accounts-payable');
    expect(response.status).toBe(401);
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(apQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(apQuerySchema.parse({ hasOverdue: 'true', page: '2' })).toEqual({ page: 2, limit: 25, hasOverdue: true });
    expect(apQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});