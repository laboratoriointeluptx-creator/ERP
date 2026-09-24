import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getCustomers, registerCustomer } from '../services/customer.service.js';
import { createCustomerSchema, customerQuerySchema } from '../validators/customer.schemas.js';

export const customerRouter = Router();
customerRouter.use(requireAuthentication);

customerRouter.get('/', requirePermission(permissions.customersRead), async (request, response, next) => {
  try {
    const query = customerQuerySchema.parse(request.query);
    const result = await getCustomers(request.auth!.organizationId, query);
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

customerRouter.post('/', requirePermission(permissions.customersCreate), async (request, response, next) => {
  try {
    const customer = await registerCustomer(request.auth!.organizationId, createCustomerSchema.parse(request.body));
    const body: ApiSuccess<typeof customer> = { success: true, data: customer };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});