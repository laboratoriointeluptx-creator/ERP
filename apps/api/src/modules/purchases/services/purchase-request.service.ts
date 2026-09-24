import { HttpError } from '../../../shared/http.js';
import { createPurchaseRequest, listPurchaseRequests } from '../repositories/purchase-request.repository.js';
import type { CreatePurchaseRequestInput, PurchaseRequestQuery } from '../validators/purchase-request.schemas.js';

export const registerPurchaseRequest = async (organizationId: string, requestedBy: string, input: CreatePurchaseRequestInput) => {
  try {
    return await createPurchaseRequest(organizationId, requestedBy, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'PURCHASE_REQUEST_CODE_EXISTS', 'Purchase request code already exists');
    }
    throw error;
  }
};

export const getPurchaseRequests = (organizationId: string, query: PurchaseRequestQuery) =>
  listPurchaseRequests(organizationId, query);
