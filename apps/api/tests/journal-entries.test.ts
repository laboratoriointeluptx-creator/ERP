import request from 'supertest';
import { app } from '../src/app.js';
import { journalEntryQuerySchema } from '../src/modules/journal-entries/validators/journal-entry.schemas.js';

describe('journal-entries', () => {
  it('requires authentication to list journal entries', async () => {
    const response = await request(app).get('/api/v1/journal-entries');
    expect(response.status).toBe(401);
  });

  it('requires authentication to create a journal entry', async () => {
    const response = await request(app).post('/api/v1/journal-entries').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates filters and applies bounded pagination defaults', () => {
    expect(journalEntryQuerySchema.parse({})).toEqual({ page: 1, limit: 25 });
    expect(journalEntryQuerySchema.parse({ status: 'POSTED', page: '2' })).toEqual({ page: 2, limit: 25, status: 'POSTED' });
    expect(journalEntryQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(journalEntryQuerySchema.safeParse({ status: 'INVALID' }).success).toBe(false);
  });
});