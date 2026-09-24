import request from 'supertest';
import { app } from '../src/app.js';

describe('purchase requests', () => {
  it('requires authentication to list purchase requests', async () => {
    const response = await request(app).get('/api/v1/purchase-requests');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});