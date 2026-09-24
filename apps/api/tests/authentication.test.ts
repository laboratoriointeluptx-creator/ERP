import request from 'supertest';
import { app } from '../src/app.js';
import { hashPassword, verifyPassword } from '../src/modules/authentication/services/password.service.js';

describe('authentication', () => {
  it('hashes passwords without retaining the plaintext', async () => {
    const password = 'correct-horse-battery-staple';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects malformed login requests consistently', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ email: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});