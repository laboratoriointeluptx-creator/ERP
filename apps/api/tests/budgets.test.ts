import request from 'supertest';
import { app } from '../src/app.js';
import { budgetQuerySchema } from '../src/modules/budgets/validators/budget.schemas.js';

describe('budgets', () => {
  it('requires authentication to list budgets', async () => {
    const response = await request(app).get('/api/v1/budgets');
    expect(response.status).toBe(401);
  });

  it('requires authentication to create a budget', async () => {
    const response = await request(app).post('/api/v1/budgets').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(budgetQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(budgetQuerySchema.parse({ fiscalYear: 2024, page: '2' })).toEqual({ page: 2, limit: 25, fiscalYear: 2024 });
    expect(budgetQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(budgetQuerySchema.safeParse({ status: 'INVALID' }).success).toBe(false);
  });
});