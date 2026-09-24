import request from 'supertest';
import { app } from '../src/app.js';

describe('catalogs', () => {
  it('requires authentication for categories', async () => {
    const response = await request(app).get('/api/v1/catalogs/categories');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('requires authentication for units', async () => {
    const response = await request(app).get('/api/v1/catalogs/units');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});