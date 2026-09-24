import request from 'supertest';
import { app } from '../src/app.js';

describe('logistics', () => {
  it('requires authentication to create shipments', async () => {
    const response = await request(app).post('/api/v1/shipments').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});