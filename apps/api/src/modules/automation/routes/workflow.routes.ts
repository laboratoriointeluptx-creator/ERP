import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { executeWorkflow } from '../services/workflow.service.js';
import { executeWorkflowSchema } from '../validators/workflow.schemas.js';

export const workflowRouter = Router();
workflowRouter.use(requireAuthentication);

workflowRouter.post('/execute', requirePermission(permissions.workflowsExecute), async (request, response, next) => {
  try {
    const execution = await executeWorkflow(request.auth!.organizationId, executeWorkflowSchema.parse(request.body));
    const body: ApiSuccess<typeof execution> = { success: true, data: execution };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
