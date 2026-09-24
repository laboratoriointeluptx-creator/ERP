import { PurchaseRequestModel, type PurchaseRequest } from '../models/purchase-request.model.js';
import type { CreatePurchaseRequestInput, PurchaseRequestQuery } from '../validators/purchase-request.schemas.js';

export const createPurchaseRequest = (organizationId: string, requestedBy: string, input: CreatePurchaseRequestInput): Promise<PurchaseRequest> =>
  PurchaseRequestModel.create({ organizationId, requestedBy, ...input });

export const listPurchaseRequests = async (
  organizationId: string,
  query: PurchaseRequestQuery,
): Promise<{ items: PurchaseRequest[]; total: number }> => {
  const filter = { organizationId, ...(query.status ? { status: query.status } : {}) };
  const [items, total] = await Promise.all([
    PurchaseRequestModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    PurchaseRequestModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
