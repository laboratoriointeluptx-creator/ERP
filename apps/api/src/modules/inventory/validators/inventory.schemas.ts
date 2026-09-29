import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const quantity = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Quantity must be a decimal string').refine((value) => {
  const [whole = '0', fraction = ''] = value.split('.');
  return BigInt(whole) > 0n || /[1-9]/.test(fraction);
}, 'Quantity must be greater than zero');
const nonNegativeQuantity = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Quantity must be a decimal string');

const paginatedQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
};

export const inventoryQuerySchema = z.object({
  ...paginatedQuery,
  warehouseId: objectId.optional(),
  productId: objectId.optional(),
});

export const inventoryMovementQuerySchema = z.object({
  ...paginatedQuery,
  warehouseId: objectId.optional(),
  productId: objectId.optional(),
  type: z.enum(['PURCHASE', 'SALE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'PRODUCTION', 'CONSUMPTION', 'DAMAGE']).optional(),
});

export const inventoryTransferQuerySchema = z.object({
  ...paginatedQuery,
  warehouseId: objectId.optional(),
  productId: objectId.optional(),
});

export const inventoryReturnQuerySchema = inventoryTransferQuerySchema.extend({ sourceType: z.enum(['SALE_ORDER', 'PURCHASE_ORDER']).optional() });

export const inventoryTransferSchema = z.object({
  sourceWarehouseId: objectId,
  destinationWarehouseId: objectId,
  productId: objectId,
  quantity,
  reason: z.string().trim().min(3).max(500),
}).strict();

export const createCycleCountSchema = z.object({
  warehouseId: objectId,
  reason: z.string().trim().min(3).max(500),
}).strict();

export const cycleCountQuerySchema = z.object({
  ...paginatedQuery,
  warehouseId: objectId.optional(),
  status: z.enum(['DRAFT', 'COMPLETED']).optional(),
});

export const completeCycleCountSchema = z.object({
  lines: z.array(z.object({ productId: objectId, countedQuantity: nonNegativeQuantity }).strict()).min(1).max(1000),
}).strict().superRefine(({ lines }, context) => {
  if (new Set(lines.map((line) => line.productId.toLowerCase())).size !== lines.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['lines'], message: 'Each product can appear only once' });
  }
});

const returnLines = z.array(z.object({ productId: objectId, quantity }).strict()).min(1).max(100).superRefine((lines, context) => {
  if (new Set(lines.map((line) => line.productId.toLowerCase())).size !== lines.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: [], message: 'Each product can appear only once' });
  }
});

export const createSalesReturnSchema = z.object({
  salesOrderId: objectId,
  reason: z.string().trim().min(3).max(500),
  lines: returnLines,
}).strict();

export const createPurchaseReturnSchema = z.object({
  purchaseOrderId: objectId,
  warehouseId: objectId,
  reason: z.string().trim().min(3).max(500),
  lines: returnLines,
}).strict();

export const movementSchema = z.object({
  warehouseId: objectId,
  productId: objectId,
  // Receipts, sales, transfers and production must go through their own workflows.
  type: z.enum(['ADJUSTMENT', 'DAMAGE']),
  direction: z.enum(['INCREASE', 'DECREASE']).optional(),
  quantity,
  reason: z.string().trim().min(3).max(500),
  referenceType: z.string().trim().max(80).optional(),
  referenceId: z.string().trim().max(80).optional(),
}).strict().superRefine((input, context) => {
  if (input.type === 'ADJUSTMENT' && !input.direction) context.addIssue({ code: z.ZodIssueCode.custom, path: ['direction'], message: 'Adjustment direction is required' });
  if (input.type === 'DAMAGE' && input.direction) context.addIssue({ code: z.ZodIssueCode.custom, path: ['direction'], message: 'Damage movements do not accept a direction' });
});

export type MovementInput = z.infer<typeof movementSchema>;
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
export type InventoryMovementQuery = z.infer<typeof inventoryMovementQuerySchema>;
export type InventoryTransferQuery = z.infer<typeof inventoryTransferQuerySchema>;
export type InventoryReturnQuery = z.infer<typeof inventoryReturnQuerySchema>;
export type InventoryTransferInput = z.infer<typeof inventoryTransferSchema>;
export type CreateCycleCountInput = z.infer<typeof createCycleCountSchema>;
export type CycleCountQuery = z.infer<typeof cycleCountQuerySchema>;
export type CompleteCycleCountInput = z.infer<typeof completeCycleCountSchema>;
export type CreateSalesReturnInput = z.infer<typeof createSalesReturnSchema>;
export type CreatePurchaseReturnInput = z.infer<typeof createPurchaseReturnSchema>;
