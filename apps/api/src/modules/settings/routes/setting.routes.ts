import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getSettings, modifySetting, registerSetting, removeSetting } from '../services/setting.service.js';
import {
  createSettingSchema,
  settingParamsSchema,
  settingQuerySchema,
  settingScopeQuerySchema,
  updateSettingSchema,
} from '../validators/setting.schemas.js';

export const settingRouter = Router();
settingRouter.use(requireAuthentication);

settingRouter.get('/', requirePermission(permissions.settingsRead ?? 'settings.read'), async (request, response, next) => {
  try {
    const query = settingQuerySchema.parse(request.query);
    const result = await getSettings(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

settingRouter.post('/', requirePermission(permissions.settingsCreate ?? 'settings.create'), async (request, response, next) => {
  try {
    const setting = await registerSetting(request.auth!.organizationId, createSettingSchema.parse(request.body));
    const body: ApiSuccess<typeof setting> = { success: true, data: setting };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

settingRouter.patch('/:key', requirePermission(permissions.settingsUpdate ?? 'settings.update'), async (request, response, next) => {
  try {
    const { key } = settingParamsSchema.parse(request.params);
    const { scope, branchId, userId } = settingScopeQuerySchema.parse(request.query);
    const setting = await modifySetting(
      request.auth!.organizationId,
      request.auth!.sub,
      key,
      updateSettingSchema.parse(request.body),
      scope,
      branchId,
      userId,
      request.ip,
    );
    response.json({ success: true, data: setting } satisfies ApiSuccess<typeof setting>);
  } catch (error: unknown) { next(error); }
});

settingRouter.delete('/:key', requirePermission(permissions.settingsDelete ?? 'settings.delete'), async (request, response, next) => {
  try {
    const { key } = settingParamsSchema.parse(request.params);
    const { scope, branchId, userId } = settingScopeQuerySchema.parse(request.query);
    await removeSetting(
      request.auth!.organizationId,
      request.auth!.sub,
      key,
      scope,
      branchId,
      userId,
      request.ip,
    );
    response.status(204).send();
  } catch (error: unknown) { next(error); }
});