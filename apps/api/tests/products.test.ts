import request from 'supertest';
import { app } from '../src/app.js';

describe('products', () => {
  it('requires authentication to list products', async () => {
    const response = await request(app).get('/api/v1/products');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});