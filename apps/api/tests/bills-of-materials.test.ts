import request from 'supertest';
import { app } from '../src/app.js';
import { bomQuerySchema } from '../src/modules/bills-of-materials/validators/bom.schemas.js';

describe('bills-of-materials', () => {
  it('requires authentication to list BOMs', async () => {
    const response = await request(app).get('/api/v1/bills-of-materials');
    expect(response.status).toBe(401);
  });

  it('requires authentication to create a BOM', async () => {
    const response = await request(app).post('/api/v1/bills-of-materials').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(bomQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(bomQuerySchema.parse({ status: 'ACTIVE', page: '2' })).toEqual({ page: 2, limit: 25, status: 'ACTIVE' });
    expect(bomQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(bomQuerySchema.safeParse({ status: 'INVALID' }).success).toBe(false);
  });
});