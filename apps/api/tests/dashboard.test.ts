import request from 'supertest';
import { app } from '../src/app.js';

describe('dashboard', () => {
  it('requires authentication to read the dashboard summary', async () => {
    const response = await request(app).get('/api/v1/dashboard/summary');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});
