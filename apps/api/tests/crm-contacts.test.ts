import request from 'supertest';
import { app } from '../src/app.js';

describe('crm contacts and activities', () => {
  it('requires authentication for contacts', async () => {
    const response = await request(app).get('/api/v1/crm/contacts/507f1f77bcf86cd799439011');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('requires authentication for activities', async () => {
    const response = await request(app).get('/api/v1/crm/activities/me');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});