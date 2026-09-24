import { HttpError } from '../../../shared/http.js';
import { createSalesOrder } from '../repositories/sales-order.repository.js';
import type { CreateSalesOrderInput } from '../validators/sales-order.schemas.js';

export const registerSalesOrder = async (organizationId: string, input: CreateSalesOrderInput) => {
  try {
    return await createSalesOrder(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'SALES_ORDER_CODE_EXISTS', 'Sales order code already exists');
    }
    throw error;
  }
};
