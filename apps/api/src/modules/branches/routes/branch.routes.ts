import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getBranches, registerBranch } from '../services/branch.service.js';
import { branchQuerySchema, createBranchSchema } from '../validators/branch.schemas.js';

export const branchRouter = Router();
branchRouter.use(requireAuthentication);

branchRouter.get('/', requirePermission(permissions.branchesRead), async (request, response, next) => {
  try {
    const query = branchQuerySchema.parse(request.query);
    const result = await getBranches(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

branchRouter.post('/', requirePermission(permissions.branchesCreate), async (request, response, next) => {
  try {
    const branch = await registerBranch(request.auth!.organizationId, createBranchSchema.parse(request.body));
    const body: ApiSuccess<typeof branch> = { success: true, data: branch };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
