import { ProductionOrderModel } from '../models/production-order.model.js';
import type { ProductionOrderQuery, CreateProductionOrderInput, UpdateProductionOrderInput, MaterialConsumptionInput } from '../validators/production-order.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createProductionOrder = (organizationId: string, input: CreateProductionOrderInput, session?: ClientSession) =>
  ProductionOrderModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findProductionOrder = (organizationId: string, id: string, session?: ClientSession) =>
  ProductionOrderModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findProductionOrderByCode = (organizationId: string, code: string, session?: ClientSession) =>
  ProductionOrderModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listProductionOrders = async (organizationId: string, query: ProductionOrderQuery) => {
  const filter: FilterQuery<typeof ProductionOrderModel> = { organizationId };
  if (query.status) filter.status = query.status;
  if (query.productId) filter.productId = query.productId;
  if (query.bomId) filter.bomId = query.bomId;
  if (query.dateFrom || query.dateTo) {
    filter.scheduledStartDate = {};
    if (query.dateFrom) filter.scheduledStartDate.$gte = query.dateFrom;
    if (query.dateTo) filter.scheduledStartDate.$lte = query.dateTo;
  }
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    ProductionOrderModel.find(filter).sort({ scheduledStartDate: 1, code: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    ProductionOrderModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateProductionOrder = (organizationId: string, id: string, input: UpdateProductionOrderInput, session?: ClientSession) =>
  ProductionOrderModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const releaseProductionOrder = (organizationId: string, id: string, actualStartDate: Date, session?: ClientSession) =>
  ProductionOrderModel.findOneAndUpdate(
    { _id: id, organizationId, status: 'PLANNED' },
    { $set: { status: 'RELEASED', actualStartDate } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const startProductionOrder = (organizationId: string, id: string, session?: ClientSession) =>
  ProductionOrderModel.findOneAndUpdate(
    { _id: id, organizationId, status: { $in: ['PLANNED', 'RELEASED'] } },
    { $set: { status: 'IN_PROGRESS', actualStartDate: new Date() } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const completeProductionOrder = (organizationId: string, id: string, producedQuantity: string, scrapQuantity: string, actualEndDate: Date, materialConsumptions: MaterialConsumptionInput[], session?: ClientSession) =>
  ProductionOrderModel.findOneAndUpdate(
    { _id: id, organizationId, status: 'IN_PROGRESS' },
    { $set: { status: 'COMPLETED', producedQuantity, scrapQuantity, actualEndDate, materialConsumptions } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const cancelProductionOrder = (organizationId: string, id: string, session?: ClientSession) =>
  ProductionOrderModel.findOneAndUpdate(
    { _id: id, organizationId, status: { $in: ['PLANNED', 'RELEASED', 'IN_PROGRESS', 'ON_HOLD'] } },
    { $set: { status: 'CANCELLED' } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const addMaterialConsumption = (organizationId: string, id: string, consumption: MaterialConsumptionInput, session?: ClientSession) =>
  ProductionOrderModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $push: { materialConsumptions: consumption } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();




