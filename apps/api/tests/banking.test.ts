import request from 'supertest';
import { app } from '../src/app.js';
import { bankAccountQuerySchema } from '../src/modules/banking/validators/bank-account.schemas.js';

describe('banking', () => {
  it('requires authentication to list bank accounts', async () => {
    const response = await request(app).get('/api/v1/banking');
    expect(response.status).toBe(401);
  });

  it('requires authentication to create a bank account', async () => {
    const response = await request(app).post('/api/v1/banking').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(bankAccountQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(bankAccountQuerySchema.parse({ type: 'CHECKING', page: '2' })).toEqual({ page: 2, limit: 25, type: 'CHECKING' });
    expect(bankAccountQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(bankAccountQuerySchema.safeParse({ type: 'INVALID' }).success).toBe(false);
  });
});