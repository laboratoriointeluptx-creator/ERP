import request from 'supertest';
import { app } from '../src/app.js';

describe('branches', () => {
  it('requires authentication to list branches', async () => {
    const response = await request(app).get('/api/v1/branches');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});