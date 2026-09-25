import request from 'supertest';
import { app } from '../src/app.js';

describe('health endpoints', () => {
  it('requires authentication to read the dashboard summary', async () => {
    const response = await request(app).get('/api/v1/dashboard/summary');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns the API status', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('reports database configuration without exposing secrets', async () => {
    const response = await request(app).get('/health/database');

    expect(response.status).toBe(200);
    expect(['not_configured', 'connecting', 'connected', 'disconnected']).toContain(response.body.data.status);
    expect(typeof response.body.data.configured).toBe('boolean');
    expect(response.body).not.toHaveProperty('MONGODB_URI');
  });

  it('returns a correlation request id', async () => {
    const response = await request(app).get('/api/v1/health').set('x-request-id', 'qa-request-1');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('qa-request-1');
  });
});
