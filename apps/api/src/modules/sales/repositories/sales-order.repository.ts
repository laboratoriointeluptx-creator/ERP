import { SalesOrderModel, type SalesOrder } from '../models/sales-order.model.js';
import type { CreateSalesOrderInput } from '../validators/sales-order.schemas.js';

export const createSalesOrder = (organizationId: string, input: CreateSalesOrderInput): Promise<SalesOrder> =>
  SalesOrderModel.create({ organizationId, ...input });
