import request from 'supertest';
import { app } from '../src/app.js';

describe('accounting', () => {
  it('requires authentication to post a journal entry', async () => {
    const response = await request(app).post('/api/v1/journal-entries').send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});