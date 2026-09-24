import { HttpError } from '../../../shared/http.js';
import { createPurchaseOrder } from '../repositories/purchase-order.repository.js';
import type { CreatePurchaseOrderInput } from '../validators/purchase-order.schemas.js';

export const registerPurchaseOrder = async (organizationId: string, input: CreatePurchaseOrderInput) => {
  try {
    return await createPurchaseOrder(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'PURCHASE_ORDER_CODE_EXISTS', 'Purchase order code already exists');
    }
    throw error;
  }
};
