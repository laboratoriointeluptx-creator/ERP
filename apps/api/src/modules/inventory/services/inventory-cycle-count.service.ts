import mongoose from 'mongoose';
import { areEqual, isGreaterThan, subtractDecimal } from '../../../shared/decimal.js';
import { HttpError } from '../../../shared/http.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { WarehouseModel } from '../../warehouses/models/warehouse.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import { InventoryMovementModel } from '../models/inventory-movement.model.js';
import { InventoryCycleCountModel } from '../models/inventory-cycle-count.model.js';
import type { CompleteCycleCountInput, CreateCycleCountInput, CycleCountQuery } from '../validators/inventory.schemas.js';

export const listCycleCounts = async (organizationId: string, query: CycleCountQuery) => {
  const filter = {
    organizationId,
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await Promise.all([
    InventoryCycleCountModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    InventoryCycleCountModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const createCycleCount = async (organizationId: string, userId: string, input: CreateCycleCountInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const warehouse = await WarehouseModel.findOne({ _id: input.warehouseId, organizationId, active: true }).session(session).exec();
      if (!warehouse) throw new HttpError(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
      const balances = await InventoryModel.find({ organizationId, warehouseId: warehouse._id }).sort({ productId: 1 }).session(session).exec();
      if (balances.length === 0) throw new HttpError(409, 'EMPTY_CYCLE_COUNT', 'There is no inventory to count in this warehouse');
      if (balances.length > 1000) throw new HttpError(413, 'CYCLE_COUNT_TOO_LARGE', 'A cycle count can include up to 1,000 stocked products');
      const [cycleCount] = await InventoryCycleCountModel.create([{
        organizationId,
        warehouseId: warehouse._id,
        reason: input.reason,
        createdBy: userId,
        status: 'DRAFT',
        lines: balances.map((balance) => ({ productId: balance.productId, expectedQuantity: balance.quantity, reservedQuantity: balance.reservedQuantity })),
      }], { session });
      if (!cycleCount) throw new Error('Cycle count creation returned no document');
      await recordAuditEvent({ organizationId, userId, action: 'inventory.cycle_count.created', module: 'inventory', entity: 'InventoryCycleCount', entityId: String(cycleCount._id), ...(ip ? { ip } : {}), after: { warehouseId: String(warehouse._id), reason: input.reason, lineCount: balances.length, status: cycleCount.status } }, session);
      result = cycleCount;
    });
    if (!result) throw new Error('Cycle count creation transaction returned no result');
    return result;
  } finally { await session.endSession(); }
};

export const completeCycleCount = async (organizationId: string, userId: string, countId: string, input: CompleteCycleCountInput, ip?: string) => {
  if (!mongoose.isValidObjectId(countId)) throw new HttpError(404, 'CYCLE_COUNT_NOT_FOUND', 'Cycle count not found');
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const cycleCount = await InventoryCycleCountModel.findOne({ _id: countId, organizationId }).session(session).exec();
      if (!cycleCount) throw new HttpError(404, 'CYCLE_COUNT_NOT_FOUND', 'Cycle count not found');
      if (cycleCount.status !== 'DRAFT') throw new HttpError(409, 'CYCLE_COUNT_ALREADY_COMPLETED', 'Cycle count has already been completed');
      const expectedProducts = cycleCount.lines.map((line) => String(line.productId).toLowerCase()).sort();
      const countedProducts = input.lines.map((line) => line.productId.toLowerCase()).sort();
      if (expectedProducts.length !== countedProducts.length || expectedProducts.some((productId, index) => productId !== countedProducts[index])) {
        throw new HttpError(409, 'CYCLE_COUNT_LINES_MISMATCH', 'Counted products must match the cycle count snapshot exactly');
      }

      const currentBalances = await InventoryModel.find({ organizationId, warehouseId: cycleCount.warehouseId }).session(session).exec();
      if (currentBalances.length !== cycleCount.lines.length) throw new HttpError(409, 'CYCLE_COUNT_STALE', 'Inventory changed after this count began; create a new count');
      const currentByProduct = new Map(currentBalances.map((balance) => [String(balance.productId), balance]));
      const countedByProduct = new Map(input.lines.map((line) => [line.productId.toLowerCase(), line.countedQuantity]));
      const varianceSummary: Array<{ productId: string; expected: string; counted: string; variance: string }> = [];
      const movementDocs: Array<Record<string, unknown>> = [];

      for (const line of cycleCount.lines) {
        const productId = String(line.productId);
        const current = currentByProduct.get(productId);
        if (!current || current.quantity !== line.expectedQuantity || current.reservedQuantity !== line.reservedQuantity) {
          throw new HttpError(409, 'CYCLE_COUNT_STALE', 'Inventory changed after this count began; create a new count');
        }
        const countedQuantity = countedByProduct.get(productId.toLowerCase());
        if (countedQuantity === undefined) throw new HttpError(409, 'CYCLE_COUNT_LINES_MISMATCH', 'A counted quantity is missing');
        if (isGreaterThan(line.reservedQuantity, countedQuantity)) throw new HttpError(409, 'CYCLE_COUNT_BELOW_RESERVED', 'Counted quantity cannot be lower than reserved inventory');

        const variance = areEqual(countedQuantity, line.expectedQuantity)
          ? '0'
          : isGreaterThan(countedQuantity, line.expectedQuantity)
            ? subtractDecimal(countedQuantity, line.expectedQuantity)
            : `-${subtractDecimal(line.expectedQuantity, countedQuantity)}`;
        varianceSummary.push({ productId, expected: line.expectedQuantity, counted: countedQuantity, variance });
        line.countedQuantity = countedQuantity;
        line.variance = variance;

        if (variance !== '0') {
          const increase = !variance.startsWith('-');
          const updated = await InventoryModel.updateOne(
            { _id: current._id, organizationId, quantity: line.expectedQuantity, reservedQuantity: line.reservedQuantity },
            { $set: { quantity: countedQuantity } },
            { session, runValidators: true },
          ).exec();
          if (updated.matchedCount !== 1) throw new HttpError(409, 'CYCLE_COUNT_STALE', 'Inventory changed after this count began; create a new count');
          movementDocs.push({ organizationId, warehouseId: cycleCount.warehouseId, productId: line.productId, type: 'ADJUSTMENT', direction: increase ? 'INCREASE' : 'DECREASE', quantity: increase ? variance : variance.slice(1), reason: `Conteo ${String(cycleCount._id)}: ${cycleCount.reason}`.slice(0, 500), referenceType: 'CYCLE_COUNT', referenceId: String(cycleCount._id) });
        }
      }

      if (movementDocs.length) await InventoryMovementModel.create(movementDocs, { session });
      cycleCount.status = 'COMPLETED';
      cycleCount.completedBy = new mongoose.Types.ObjectId(userId);
      cycleCount.completedAt = new Date();
      await cycleCount.save({ session });
      await recordAuditEvent({ organizationId, userId, action: 'inventory.cycle_count.completed', module: 'inventory', entity: 'InventoryCycleCount', entityId: String(cycleCount._id), ...(ip ? { ip } : {}), before: { status: 'DRAFT', lineCount: cycleCount.lines.length }, after: { status: cycleCount.status, warehouseId: String(cycleCount.warehouseId), varianceLines: varianceSummary.filter((line) => line.variance !== '0'), lineCount: varianceSummary.length } }, session);
      result = cycleCount;
    });
    if (!result) throw new Error('Cycle count completion transaction returned no result');
    return result;
  } finally { await session.endSession(); }
};
