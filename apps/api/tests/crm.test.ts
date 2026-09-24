import request from 'supertest';
import { app } from '../src/app.js';

describe('crm leads', () => {
  it('requires authentication to list leads', async () => {
    const response = await request(app).get('/api/v1/crm/leads');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});