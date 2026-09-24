import request from 'supertest';
import { app } from '../src/app.js';

describe('workflows', () => {
  it('requires authentication to execute a workflow', async () => {
    const response = await request(app).post('/api/v1/workflows/execute').send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});