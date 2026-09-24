import { Router } from 'express';
import { HttpError, type ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getActivities, getContacts, registerActivity, registerContact } from '../services/contact-activity.service.js';
import { createActivitySchema, createContactSchema } from '../validators/contact-activity.schemas.js';

export const contactActivityRouter = Router();
contactActivityRouter.use(requireAuthentication);

contactActivityRouter.get('/contacts/:customerId', requirePermission(permissions.crmRead), async (request, response, next) => {
  try {
    const customerId = request.params.customerId;
    if (typeof customerId !== 'string') throw new HttpError(400, 'INVALID_CUSTOMER_ID', 'Invalid customer id');
    const data = await getContacts(request.auth!.organizationId, customerId);
    response.json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});

contactActivityRouter.post('/contacts', requirePermission(permissions.crmCreate), async (request, response, next) => {
  try { const data = await registerContact(request.auth!.organizationId, createContactSchema.parse(request.body)); response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});

contactActivityRouter.get('/activities/me', requirePermission(permissions.crmRead), async (request, response, next) => {
  try { const data = await getActivities(request.auth!.organizationId, request.auth!.sub); response.json({ success: true, data } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});

contactActivityRouter.post('/activities', requirePermission(permissions.crmCreate), async (request, response, next) => {
  try { const data = await registerActivity(request.auth!.organizationId, request.auth!.sub, createActivitySchema.parse(request.body)); response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>); } catch (error: unknown) { next(error); }
});
