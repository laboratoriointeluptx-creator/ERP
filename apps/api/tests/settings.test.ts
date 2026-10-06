import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/shared/http.js';
import { settingRouter } from '../src/modules/settings/routes/setting.routes.js';
import { settingQuerySchema } from '../src/modules/settings/validators/setting.schemas.js';

const app = express();
app.use(express.json());
app.use('/api/v1/settings', settingRouter);
app.use(errorHandler);

describe('settings', () => {
  it('requires authentication to list settings', async () => {
    const response = await request(app).get('/api/v1/settings');
    expect(response.status).toBe(401);
  });

  it('requires authentication to create a setting', async () => {
    const response = await request(app).post('/api/v1/settings').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(settingQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(settingQuerySchema.parse({ scope: 'branch', page: '2' })).toEqual({ page: 2, limit: 25, scope: 'branch' });
    expect(settingQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(settingQuerySchema.safeParse({ scope: 'INVALID' }).success).toBe(false);
  });

});