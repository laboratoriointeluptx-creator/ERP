import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getProjects, modifyProject, registerProject, removeProject } from '../services/project.service.js';
import { projectQuerySchema, createProjectSchema, updateProjectSchema } from '../validators/project.schemas.js';

export const projectRouter = Router();
projectRouter.use(requireAuthentication);

projectRouter.get('/', requirePermission(permissions.projectsRead), async (request, response, next) => {
  try {
    const query = projectQuerySchema.parse(request.query);
    const result = await getProjects(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

projectRouter.post('/', requirePermission(permissions.projectsCreate), async (request, response, next) => {
  try {
    const project = await registerProject(request.auth!.organizationId, createProjectSchema.parse(request.body));
    const body: ApiSuccess<typeof project> = { success: true, data: project };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

projectRouter.patch('/:id', requirePermission(permissions.projectsUpdate), async (request, response, next) => {
  try {
    const project = await modifyProject(request.auth!.organizationId, request.auth!.sub, String(request.params.id), updateProjectSchema.parse(request.body), request.ip);
    response.json({ success: true, data: project } satisfies ApiSuccess<typeof project>);
  } catch (error: unknown) { next(error); }
});

projectRouter.delete('/:id', requirePermission(permissions.projectsManage), async (request, response, next) => {
  try {
    await removeProject(request.auth!.organizationId, request.auth!.sub, String(request.params.id), request.ip);
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});