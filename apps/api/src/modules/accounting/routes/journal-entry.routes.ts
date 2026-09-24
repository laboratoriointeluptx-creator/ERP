import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { registerJournalEntry } from '../services/journal-entry.service.js';
import { createJournalEntrySchema } from '../validators/journal-entry.schemas.js';

export const journalEntryRouter = Router();
journalEntryRouter.use(requireAuthentication);

journalEntryRouter.post('/', requirePermission(permissions.accountingPost), async (request, response, next) => {
  try {
    const entry = await registerJournalEntry(request.auth!.organizationId, request.auth!.sub, createJournalEntrySchema.parse(request.body));
    const body: ApiSuccess<typeof entry> = { success: true, data: entry };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
