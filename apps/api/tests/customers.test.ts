import request from 'supertest';
import { app } from '../src/app.js';

describe('customers', () => {
  it('requires authentication to list customers', async () => {
    const response = await request(app).get('/api/v1/customers');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('requires authentication to create a customer', async () => {
    const response = await request(app)
      .post('/api/v1/customers')
      .send({ code: 'C-001', name: 'Cliente demo' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});
