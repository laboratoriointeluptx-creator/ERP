import { BomModel, type Bom } from '../models/bom.model.js';
import { ProductionOrderModel, type ProductionOrder } from '../models/production-order.model.js';
import type { CreateBomInput, CreateProductionOrderInput } from '../validators/manufacturing.schemas.js';

export const createBom = (organizationId: string, input: CreateBomInput): Promise<Bom> => BomModel.create({ organizationId, ...input });

export const createProductionOrder = (organizationId: string, input: CreateProductionOrderInput): Promise<ProductionOrder> =>
  ProductionOrderModel.create({ organizationId, ...input });
