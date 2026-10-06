import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getJournalEntries, modifyJournalEntry, postEntry, registerJournalEntry, reverseEntry, voidEntry } from '../services/journal-entry.service.js';
import { createJournalEntrySchema, journalEntryQuerySchema, postJournalEntrySchema, updateJournalEntrySchema } from '../validators/journal-entry.schemas.js';

export const journalEntryRouter = Router();
journalEntryRouter.use(requireAuthentication);

journalEntryRouter.get('/', requirePermission(permissions.journalEntriesRead), async (request, response, next) => {
  try {
    const query = journalEntryQuerySchema.parse(request.query);
    const result = await getJournalEntries(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

journalEntryRouter.post('/', requirePermission(permissions.journalEntriesCreate), async (request, response, next) => {
  try {
    const entry = await registerJournalEntry(request.auth!.organizationId, createJournalEntrySchema.parse(request.body));
    const body: ApiSuccess<typeof entry> = { success: true, data: entry };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

journalEntryRouter.patch('/:id', requirePermission(permissions.journalEntriesUpdate), async (request, response, next) => {
  try {
    const entry = await modifyJournalEntry(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateJournalEntrySchema.parse(request.body), request.ip);
    response.json({ success: true, data: entry } satisfies ApiSuccess<typeof entry>);
  } catch (error: unknown) { next(error); }
});

journalEntryRouter.post('/:id/post', requirePermission(permissions.journalEntriesPost), async (request, response, next) => {
  try {
    const entry = await postEntry(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.json({ success: true, data: entry } satisfies ApiSuccess<typeof entry>);
  } catch (error: unknown) { next(error); }
});

journalEntryRouter.post('/:id/reverse', requirePermission(permissions.journalEntriesReverse), async (request, response, next) => {
  try {
    const result = await reverseEntry(request.auth!.organizationId, request.auth!.sub, String(request.params.id), postJournalEntrySchema.parse(request.body), request.ip);
    response.json({ success: true, data: result } satisfies ApiSuccess<typeof result>);
  } catch (error: unknown) { next(error); }
});

journalEntryRouter.post('/:id/void', requirePermission(permissions.journalEntriesReverse), async (request, response, next) => {
  try {
    const entry = await voidEntry(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.json({ success: true, data: entry } satisfies ApiSuccess<typeof entry>);
  } catch (error: unknown) { next(error); }
});