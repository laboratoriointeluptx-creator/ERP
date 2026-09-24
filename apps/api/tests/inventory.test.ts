import request from 'supertest';
import { app } from '../src/app.js';

describe('inventory', () => {
  it('requires authentication to create a movement', async () => {
    const response = await request(app).post('/api/v1/inventory/movements').send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});