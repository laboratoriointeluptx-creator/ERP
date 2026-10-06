import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { addDecimal, isGreaterThan, subtractDecimal } from '../../../shared/decimal.js';
import { createProductionOrder, findProductionOrder, findProductionOrderByCode, listProductionOrders, updateProductionOrder, releaseProductionOrder, startProductionOrder, completeProductionOrder, cancelProductionOrder, addMaterialConsumption } from '../repositories/production-order.repository.js';
import { BomModel } from '../../bills-of-materials/models/bom.model.js';
import { ProductModel } from '../../products/models/product.model.js';
import { InventoryModel } from '../../inventory/models/inventory.model.js';
import type { CreateProductionOrderInput, ProductionOrderQuery, UpdateProductionOrderInput, ReleaseProductionOrderInput, CompleteProductionOrderInput, MaterialConsumptionInput } from '../validators/production-order.schemas.js';

export const registerProductionOrder = async (organizationId: string, input: CreateProductionOrderInput) => {
  const product = await ProductModel.findOne({ _id: input.productId, organizationId }).exec();
  if (!product) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

  if (input.bomId) {
    const bom = await BomModel.findOne({ _id: input.bomId, organizationId }).exec();
    if (!bom) throw new HttpError(404, 'BOM_NOT_FOUND', 'BOM not found');
  }

  try {
    return await createProductionOrder(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'PRODUCTION_ORDER_CODE_EXISTS', 'Production order code already exists');
    }
    throw error;
  }
};

export const getProductionOrders = (organizationId: string, query: ProductionOrderQuery) => listProductionOrders(organizationId, query);

export const modifyProductionOrder = async (organizationId: string, actorId: string, id: string, input: UpdateProductionOrderInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findProductionOrder(organizationId, id, session);
      if (!before) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');
      if (input.productId) {
        const product = await ProductModel.findOne({ _id: input.productId, organizationId }).session(session).exec();
        if (!product) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }
      if (input.bomId) {
        const bom = await BomModel.findOne({ _id: input.bomId, organizationId }).session(session).exec();
        if (!bom) throw new HttpError(404, 'BOM_NOT_FOUND', 'BOM not found');
      }
      const updated = await updateProductionOrder(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'production-order.updated',
        module: 'production-orders',
        entity: 'ProductionOrder',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Production order update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const releaseOrder = async (organizationId: string, actorId: string, id: string, input: ReleaseProductionOrderInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findProductionOrder(organizationId, id, session);
      if (!before) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');
      if (before.status !== 'PLANNED') throw new HttpError(409, 'INVALID_STATUS', 'Only planned orders can be released');
      const updated = await releaseProductionOrder(organizationId, id, input.actualStartDate ?? new Date(), session);
      if (!updated) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'production-order.released',
        module: 'production-orders',
        entity: 'ProductionOrder',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const startOrder = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findProductionOrder(organizationId, id, session);
      if (!before) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');
      if (before.status !== 'RELEASED' && before.status !== 'PLANNED') throw new HttpError(409, 'INVALID_STATUS', 'Order must be released or planned to start');
      const updated = await startProductionOrder(organizationId, id, session);
      if (!updated) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'production-order.started',
        module: 'production-orders',
        entity: 'ProductionOrder',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const completeOrder = async (organizationId: string, actorId: string, id: string, input: CompleteProductionOrderInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findProductionOrder(organizationId, id, session);
      if (!before) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');
      if (before.status !== 'IN_PROGRESS') throw new HttpError(409, 'INVALID_STATUS', 'Only in-progress orders can be completed');

      for (const consumption of input.materialConsumptions ?? []) {
        const inventory = await InventoryModel.findOne({
          organizationId,
          warehouseId: consumption.warehouseId,
          productId: consumption.productId,
        }).session(session).exec();
        if (!inventory) throw new HttpError(404, 'INVENTORY_NOT_FOUND', `Inventory not found for product ${consumption.productId}`);
        const available = subtractDecimal(inventory.quantity, inventory.reservedQuantity);
        if (isGreaterThan(consumption.consumedQuantity, available)) {
          throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock for material consumption');
        }
        await InventoryModel.findOneAndUpdate(
          { organizationId, warehouseId: consumption.warehouseId, productId: consumption.productId },
          { $inc: { quantity: `-${consumption.consumedQuantity}` } },
          { session, new: true },
        ).exec();

        await addMaterialConsumption(organizationId, id, consumption, session);
      }

      const updated = await completeProductionOrder(organizationId, id, input.producedQuantity, input.scrapQuantity, input.actualEndDate ?? new Date(), input.materialConsumptions ?? [], session);
      if (!updated) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');

      const finishedProduct = await ProductModel.findOne({ _id: before.productId, organizationId }).session(session).exec();
      if (finishedProduct && Number(input.producedQuantity) > 0) {
        const warehouseId = input.materialConsumptions?.[0]?.warehouseId ?? before.branchId;
        if (warehouseId) {
          await InventoryModel.findOneAndUpdate(
            { organizationId, warehouseId, productId: before.productId },
            { $inc: { quantity: input.producedQuantity }, $setOnInsert: { reservedQuantity: '0' } },
            { upsert: true, session, new: true },
          ).exec();
        }
      }

      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'production-order.completed',
        module: 'production-orders',
        entity: 'ProductionOrder',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const cancelOrder = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findProductionOrder(organizationId, id, session);
      if (!before) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');
      if (before.status === 'COMPLETED' || before.status === 'CANCELLED') throw new HttpError(409, 'INVALID_STATUS', 'Cannot cancel completed or already cancelled order');
      const updated = await cancelProductionOrder(organizationId, id, session);
      if (!updated) throw new HttpError(404, 'PRODUCTION_ORDER_NOT_FOUND', 'Production order not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'production-order.cancelled',
        module: 'production-orders',
        entity: 'ProductionOrder',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};