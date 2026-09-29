import { Router } from 'express';
import type { ApiSuccess } from '../../../shared/http.js';
import { requireAuthentication } from '../../authentication/middleware/authentication.middleware.js';
import { requirePermission } from '../../authorization/middleware/authorization.middleware.js';
import { permissions } from '../../authorization/permissions.js';
import { applyInventoryMovement, listInventoryBalances, listInventoryMovements } from '../repositories/inventory.repository.js';
import { listInventoryTransfers, transferInventory } from '../services/inventory-transfer.service.js';
import { completeCycleCount, createCycleCount, listCycleCounts } from '../services/inventory-cycle-count.service.js';
import { createPurchaseReturn, createSalesReturn, listInventoryReturns } from '../services/inventory-return.service.js';
import { completeCycleCountSchema, createCycleCountSchema, createPurchaseReturnSchema, createSalesReturnSchema, cycleCountQuerySchema, inventoryMovementQuerySchema, inventoryQuerySchema, inventoryReturnQuerySchema, inventoryTransferQuerySchema, inventoryTransferSchema, movementSchema } from '../validators/inventory.schemas.js';

export const inventoryRouter = Router();
inventoryRouter.use(requireAuthentication);

inventoryRouter.get('/', requirePermission(permissions.inventoryRead), async (request, response, next) => {
  try {
    const query = inventoryQuerySchema.parse(request.query);
    const result = await listInventoryBalances(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

inventoryRouter.get('/movements', requirePermission(permissions.inventoryRead), async (request, response, next) => {
  try {
    const query = inventoryMovementQuerySchema.parse(request.query);
    const result = await listInventoryMovements(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) {
    next(error);
  }
});

inventoryRouter.get('/transfers', requirePermission(permissions.inventoryRead), async (request, response, next) => {
  try {
    const query = inventoryTransferQuerySchema.parse(request.query);
    const result = await listInventoryTransfers(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

inventoryRouter.post('/transfers', requirePermission(permissions.inventoryAdjust), async (request, response, next) => {
  try {
    const data = await transferInventory(request.auth!.organizationId, request.auth!.sub, inventoryTransferSchema.parse(request.body), request.ip);
    const body: ApiSuccess<typeof data> = { success: true, data };
    response.status(201).json(body);
  } catch (error: unknown) { next(error); }
});

inventoryRouter.get('/cycle-counts', requirePermission(permissions.inventoryRead), async (request, response, next) => {
  try {
    const query = cycleCountQuerySchema.parse(request.query);
    const result = await listCycleCounts(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

inventoryRouter.post('/cycle-counts', requirePermission(permissions.inventoryAdjust), async (request, response, next) => {
  try {
    const data = await createCycleCount(request.auth!.organizationId, request.auth!.sub, createCycleCountSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});

inventoryRouter.post('/cycle-counts/:id/complete', requirePermission(permissions.inventoryAdjust), async (request, response, next) => {
  try {
    const data = await completeCycleCount(request.auth!.organizationId, request.auth!.sub, String(request.params.id), completeCycleCountSchema.parse(request.body), request.ip);
    response.json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});

inventoryRouter.get('/returns', requirePermission(permissions.inventoryRead), async (request, response, next) => {
  try {
    const query = inventoryReturnQuerySchema.parse(request.query);
    const result = await listInventoryReturns(request.auth!.organizationId, query);
    const body: ApiSuccess<typeof result> = { success: true, data: result, meta: { page: query.page, limit: query.limit, total: result.total } };
    response.json(body);
  } catch (error: unknown) { next(error); }
});

inventoryRouter.post('/returns/sales', requirePermission(permissions.inventoryAdjust), async (request, response, next) => {
  try {
    const data = await createSalesReturn(request.auth!.organizationId, request.auth!.sub, createSalesReturnSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});

inventoryRouter.post('/returns/purchases', requirePermission(permissions.inventoryAdjust), async (request, response, next) => {
  try {
    const data = await createPurchaseReturn(request.auth!.organizationId, request.auth!.sub, createPurchaseReturnSchema.parse(request.body), request.ip);
    response.status(201).json({ success: true, data } satisfies ApiSuccess<typeof data>);
  } catch (error: unknown) { next(error); }
});

inventoryRouter.post('/movements', requirePermission(permissions.inventoryAdjust), async (request, response, next) => {
  try {
    const data = await applyInventoryMovement(
      request.auth!.organizationId,
      request.auth!.sub,
      movementSchema.parse(request.body),
      request.ip,
    );
    const body: ApiSuccess<typeof data> = { success: true, data };
    response.status(201).json(body);
  } catch (error: unknown) {
    next(error);
  }
});
