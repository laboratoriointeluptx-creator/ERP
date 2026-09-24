import { PurchaseOrderModel, type PurchaseOrder } from '../models/purchase-order.model.js';
import type { CreatePurchaseOrderInput } from '../validators/purchase-order.schemas.js';

export const createPurchaseOrder = (organizationId: string, input: CreatePurchaseOrderInput): Promise<PurchaseOrder> =>
  PurchaseOrderModel.create({ organizationId, ...input });
