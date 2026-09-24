import request from 'supertest';
import { app } from '../src/app.js';

describe('organizations', () => {
  it('requires authentication to read the current organization', async () => {
    const response = await request(app).get('/api/v1/organizations/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('requires authentication to update the current organization', async () => {
    const response = await request(app)
      .patch('/api/v1/organizations/me')
      .send({ name: 'Updated organization' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});