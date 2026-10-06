import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getTasks, modifyTask, registerTask, removeTask } from '../services/task.service.js';
import { taskQuerySchema, createTaskSchema, updateTaskSchema } from '../validators/task.schemas.js';

export const taskRouter = Router();
taskRouter.use(requireAuthentication);

taskRouter.get('/', requirePermission(permissions.tasksRead), async (request, response, next) => {
  try {
    const query = taskQuerySchema.parse(request.query);
    const result = await getTasks(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

taskRouter.post('/', requirePermission(permissions.tasksCreate), async (request, response, next) => {
  try {
    const task = await registerTask(request.auth!.organizationId, createTaskSchema.parse(request.body));
    const body: ApiSuccess<typeof task> = { success: true, data: task };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

taskRouter.patch('/:id', requirePermission(permissions.tasksUpdate), async (request, response, next) => {
  try {
    const task = await modifyTask(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateTaskSchema.parse(request.body), request.ip);
    response.json({ success: true, data: task } satisfies ApiSuccess<typeof task>);
  } catch (error: unknown) { next(error); }
});

taskRouter.delete('/:id', requirePermission(permissions.tasksUpdate), async (request, response, next) => {
  try {
    await removeTask(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});