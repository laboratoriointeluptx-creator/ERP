import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { getProducts, registerProduct } from '../services/product.service.js';
import { createProductSchema, productQuerySchema } from '../validators/product.schemas.js';

export const productRouter = Router();
productRouter.use(requireAuthentication);

productRouter.get('/', requirePermission(permissions.productsRead), async (request, response, next) => {
  try {
    const query = productQuerySchema.parse(request.query);
    const result = await getProducts(request.auth!.organizationId, query);
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

productRouter.post('/', requirePermission(permissions.productsCreate), async (request, response, next) => {
  try {
    const product = await registerProduct(request.auth!.organizationId, createProductSchema.parse(request.body));
    const body: ApiSuccess<typeof product> = { success: true, data: product };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
