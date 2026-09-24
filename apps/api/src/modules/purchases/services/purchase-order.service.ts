import { HttpError } from '../../../shared/http.js';
import { isGreaterThan } from '../../../shared/decimal.js';
import { ProductModel } from '../../products/models/product.model.js';
import { PurchaseRequestModel } from '../models/purchase-request.model.js';
import { SupplierModel } from '../../suppliers/models/supplier.model.js';
import { createPurchaseOrder } from '../repositories/purchase-order.repository.js';
import type { CreatePurchaseOrderInput } from '../validators/purchase-order.schemas.js';

export const validateApprovedPurchaseRequest = (
  status: string,
  requestedLines: readonly { productId: string; quantity: string }[],
  purchaseOrderLines: readonly { productId: string; quantity: string }[],
): void => {
  if (status !== 'APPROVED') {
    throw new HttpError(409, 'PURCHASE_REQUEST_NOT_APPROVED', 'A purchase order can only be linked to an approved purchase request');
  }
  const requested = new Map(requestedLines.map((line) => [line.productId, line.quantity]));
  for (const line of purchaseOrderLines) {
    const requestedQuantity = requested.get(line.productId);
    if (requestedQuantity === undefined) {
      throw new HttpError(400, 'PRODUCT_NOT_IN_PURCHASE_REQUEST', 'Purchase order contains a product that is not in the approved request');
    }
    if (isGreaterThan(line.quantity, requestedQuantity)) {
      throw new HttpError(400, 'PURCHASE_ORDER_QUANTITY_EXCEEDS_REQUEST', 'Purchase order quantity exceeds the approved request quantity');
    }
  }
};

export const registerPurchaseOrder = async (organizationId: string, input: CreatePurchaseOrderInput) => {
  try {
    const uniqueProductIds = [...new Set(input.lines.map((line) => line.productId))];
    const [supplier, products, purchaseRequest] = await Promise.all([
      SupplierModel.findOne({ _id: input.supplierId, organizationId, active: true }).exec(),
      ProductModel.find({ _id: { $in: uniqueProductIds }, organizationId, active: true }).exec(),
      input.purchaseRequestId
        ? PurchaseRequestModel.findOne({ _id: input.purchaseRequestId, organizationId }).exec()
        : Promise.resolve(null),
    ]);
    if (!supplier) throw new HttpError(404, 'SUPPLIER_NOT_FOUND', 'Supplier not found');
    if (products.length !== uniqueProductIds.length) {
      throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'One or more purchase order products were not found');
    }
    if (input.purchaseRequestId) {
      if (!purchaseRequest) throw new HttpError(404, 'PURCHASE_REQUEST_NOT_FOUND', 'Purchase request not found');
      validateApprovedPurchaseRequest(
        purchaseRequest.status,
        purchaseRequest.lines.map((line) => ({ productId: String(line.productId), quantity: line.quantity })),
        input.lines,
      );
    }
    return await createPurchaseOrder(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'PURCHASE_ORDER_CODE_EXISTS', 'Purchase order code already exists');
    }
    throw error;
  }
};
