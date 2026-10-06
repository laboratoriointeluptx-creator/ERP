import request from 'supertest';
import { app } from '../src/app.js';
import { arQuerySchema } from '../src/modules/accounts-receivable/validators/accounts-receivable.schemas.js';

describe('accounts-receivable', () => {
  it('requires authentication to list AR', async () => {
    const response = await request(app).get('/api/v1/accounts-receivable');
    expect(response.status).toBe(401);
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(arQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(arQuerySchema.parse({ hasOverdue: 'true', page: '2' })).toEqual({ page: 2, limit: 25, hasOverdue: true });
    expect(arQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});