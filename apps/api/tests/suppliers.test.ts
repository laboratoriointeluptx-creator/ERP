import request from 'supertest';
import { app } from '../src/app.js';

describe('suppliers', () => {
  it('requires authentication to list suppliers', async () => {
    const response = await request(app).get('/api/v1/suppliers');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});