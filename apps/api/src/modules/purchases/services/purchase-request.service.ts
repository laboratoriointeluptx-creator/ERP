import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { ProductModel } from '../../products/models/product.model.js';
import { PurchaseRequestModel } from '../models/purchase-request.model.js';
import { createPurchaseRequest, listPurchaseRequests } from '../repositories/purchase-request.repository.js';
import type { CreatePurchaseRequestInput, PurchaseRequestQuery, ReviewPurchaseRequestInput } from '../validators/purchase-request.schemas.js';

export type PurchaseRequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type PurchaseRequestAction = 'SUBMIT' | 'APPROVE' | 'REJECT';

export const nextPurchaseRequestStatus = (status: PurchaseRequestStatus, action: PurchaseRequestAction): PurchaseRequestStatus => {
  if (status === 'DRAFT' && action === 'SUBMIT') return 'SUBMITTED';
  if (status === 'SUBMITTED' && action === 'APPROVE') return 'APPROVED';
  if (status === 'SUBMITTED' && action === 'REJECT') return 'REJECTED';
  throw new HttpError(409, 'INVALID_PURCHASE_REQUEST_TRANSITION', `Cannot ${action.toLowerCase()} a purchase request in ${status.toLowerCase()} state`);
};

export const registerPurchaseRequest = async (organizationId: string, requestedBy: string, input: CreatePurchaseRequestInput) => {
  try {
    const productIds = input.lines.map((line) => line.productId);
    const products = await ProductModel.find({ _id: { $in: productIds }, organizationId, active: true }).exec();
    if (products.length !== productIds.length) {
      throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'One or more purchase request products were not found');
    }
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

export const transitionPurchaseRequest = async (
  organizationId: string,
  userId: string,
  requestId: string,
  action: PurchaseRequestAction,
  review?: ReviewPurchaseRequestInput,
  ip?: string,
) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const purchaseRequest = await PurchaseRequestModel.findOne({ _id: requestId, organizationId }).session(session).exec();
      if (!purchaseRequest) throw new HttpError(404, 'PURCHASE_REQUEST_NOT_FOUND', 'Purchase request not found');
      if (action === 'SUBMIT' && String(purchaseRequest.requestedBy) !== userId) {
        throw new HttpError(403, 'PURCHASE_REQUEST_OWNER_REQUIRED', 'Only the request owner can submit it');
      }

      const previousStatus = purchaseRequest.status;
      purchaseRequest.status = nextPurchaseRequestStatus(purchaseRequest.status, action);
      if (action === 'SUBMIT') {
        purchaseRequest.submittedAt = new Date();
      } else {
        purchaseRequest.reviewedBy = new mongoose.Types.ObjectId(userId);
        purchaseRequest.reviewedAt = new Date();
        if (review?.note) purchaseRequest.reviewNote = review.note;
      }
      await purchaseRequest.save({ session });
      await recordAuditEvent({
        organizationId,
        userId,
        action: `purchase-request.${action.toLowerCase()}`,
        module: 'purchases',
        entity: 'PurchaseRequest',
        entityId: String(purchaseRequest._id),
        ...(ip ? { ip } : {}),
        before: { status: previousStatus },
        after: { status: purchaseRequest.status, ...(review?.note ? { reviewNote: review.note } : {}) },
      }, session);
      result = purchaseRequest;
    });
    return result;
  } finally {
    await session.endSession();
  }
};
