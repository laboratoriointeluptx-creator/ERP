import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import {
  getOrganizationUsers,
  registerOrganizationUser,
  setOrganizationUserStatus,
} from '../services/user.service.js';
import {
  createUserSchema,
  updateUserStatusSchema,
  userParamsSchema,
  userQuerySchema,
} from '../validators/user.schemas.js';

export const userRouter = Router();
userRouter.use(requireAuthentication);

userRouter.get('/', requirePermission(permissions.usersRead), async (request, response, next) => {
  try {
    const query = userQuerySchema.parse(request.query);
    const result = await getOrganizationUsers(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = {
      success: true,
      data: result,
      meta: { page: query.page, limit: query.limit, total: result.total },
    };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

userRouter.post('/', requirePermission(permissions.usersCreate), async (request, response, next) => {
  try {
    const user = await registerOrganizationUser(
      request.auth!.organizationId,
      request.auth!.sub,
      createUserSchema.parse(request.body),
      request.ip,
    );
    const body: ApiSuccess<typeof user> = { success: true, data: user };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});

userRouter.patch('/:id/status', requirePermission(permissions.usersUpdate), async (request, response, next) => {
  try {
    const { id } = userParamsSchema.parse(request.params);
    const { active } = updateUserStatusSchema.parse(request.body);
    const user = await setOrganizationUserStatus(
      request.auth!.organizationId,
      request.auth!.sub,
      id,
      active,
      request.ip,
    );
    const body: ApiSuccess<typeof user> = { success: true, data: user };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});
