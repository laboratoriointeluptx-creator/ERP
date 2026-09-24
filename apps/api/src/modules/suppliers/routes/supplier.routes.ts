import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getSuppliers, registerSupplier } from '../services/supplier.service.js';
import { createSupplierSchema, supplierQuerySchema } from '../validators/supplier.schemas.js';

export const supplierRouter = Router();
supplierRouter.use(requireAuthentication);

supplierRouter.get('/', requirePermission(permissions.suppliersRead), async (request, response, next) => {
  try {
    const query = supplierQuerySchema.parse(request.query);
    const result = await getSuppliers(request.auth!.organizationId, query);
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

supplierRouter.post('/', requirePermission(permissions.suppliersCreate), async (request, response, next) => {
  try {
    const supplier = await registerSupplier(request.auth!.organizationId, createSupplierSchema.parse(request.body));
    const body: ApiSuccess<typeof supplier> = { success: true, data: supplier };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
