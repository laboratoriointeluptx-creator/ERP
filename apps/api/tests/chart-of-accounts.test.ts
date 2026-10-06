import request from 'supertest';
import { app } from '../src/app.js';
import { accountQuerySchema } from '../src/modules/chart-of-accounts/validators/account.schemas.js';

describe('chart-of-accounts', () => {
  it('requires authentication to list accounts', async () => {
    const response = await request(app).get('/api/v1/chart-of-accounts');
    expect(response.status).toBe(401);
  });

  it('requires authentication to create an account', async () => {
    const response = await request(app).post('/api/v1/chart-of-accounts').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(accountQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(accountQuerySchema.parse({ type: 'ASSET', page: '2' })).toEqual({ page: 2, limit: 25, type: 'ASSET' });
    expect(accountQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(accountQuerySchema.safeParse({ type: 'INVALID' }).success).toBe(false);
  });
});