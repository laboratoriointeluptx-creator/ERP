import request from 'supertest';
import { app } from '../src/app.js';
import { taxQuerySchema } from '../src/modules/taxes/validators/tax.schemas.js';

describe('taxes', () => {
  it('requires authentication to list taxes', async () => {
    const response = await request(app).get('/api/v1/taxes');
    expect(response.status).toBe(401);
  });

  it('requires authentication to create a tax', async () => {
    const response = await request(app).post('/api/v1/taxes').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(taxQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(taxQuerySchema.parse({ type: 'IVA', page: '2' })).toEqual({ page: 2, limit: 25, type: 'IVA' });
    expect(taxQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(taxQuerySchema.safeParse({ type: 'INVALID' }).success).toBe(false);
  });
});