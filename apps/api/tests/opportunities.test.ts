import request from 'supertest';
import { app } from '../src/app.js';

describe('crm opportunities', () => {
  it('requires authentication to list opportunities', async () => {
    const response = await request(app).get('/api/v1/crm/opportunities');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});