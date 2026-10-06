import { z } from 'zod';

export const productionOrderLineSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
  producedQuantity: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  scrapQuantity: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  unitId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  workCenterId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  operationSequence: z.coerce.number().int().positive().default(10),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL']).default('PENDING'),
});

export const materialConsumptionSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  plannedQuantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
  consumedQuantity: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  unitId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  lotId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  serialNumberId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['PENDING', 'PARTIAL', 'COMPLETED']).default('PENDING'),
});

export const createProductionOrderSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  bomId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  plannedQuantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
  unitId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  priority: z.coerce.number().int().min(1).max(100).default(50),
  scheduledStartDate: z.coerce.date().optional(),
  scheduledEndDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  referenceType: z.string().max(80).optional(),
  referenceId: z.string().max(80).optional(),
});

export const updateProductionOrderSchema = createProductionOrderSchema.partial();

export const releaseProductionOrderSchema = z.object({
  actualStartDate: z.coerce.date().optional(),
});

export const completeProductionOrderSchema = z.object({
  producedQuantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
  scrapQuantity: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  actualEndDate: z.coerce.date().optional(),
  materialConsumptions: z.array(materialConsumptionSchema).optional(),
});

export const productionOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  bomId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(160).optional(),
});

export type CreateProductionOrderInput = z.infer<typeof createProductionOrderSchema>;
export type UpdateProductionOrderInput = z.infer<typeof updateProductionOrderSchema>;
export type ReleaseProductionOrderInput = z.infer<typeof releaseProductionOrderSchema>;
export type CompleteProductionOrderInput = z.infer<typeof completeProductionOrderSchema>;
export type ProductionOrderQuery = z.infer<typeof productionOrderQuerySchema>;
export type ProductionOrderLineInput = z.infer<typeof productionOrderLineSchema>;
export type MaterialConsumptionInput = z.infer<typeof materialConsumptionSchema>;