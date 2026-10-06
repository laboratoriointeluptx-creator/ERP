import { WebhookModel } from '../models/webhook.model.js';
import type { WebhookQuery, CreateWebhookInput, UpdateWebhookInput } from '../validators/webhook.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createWebhook = (organizationId: string, input: CreateWebhookInput, session?: ClientSession) =>
  WebhookModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findWebhook = (organizationId: string, id: string, session?: ClientSession) =>
  WebhookModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findWebhookByCode = (organizationId: string, code: string, session?: ClientSession) =>
  WebhookModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listWebhooks = async (organizationId: string, query: WebhookQuery) => {
  const filter: FilterQuery<typeof WebhookModel> = { organizationId };
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    WebhookModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    WebhookModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateWebhook = (organizationId: string, id: string, input: UpdateWebhookInput, session?: ClientSession) =>
  WebhookModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteWebhook = (organizationId: string, id: string, session?: ClientSession) =>
  WebhookModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const findWebhooksByEvent = (organizationId: string, event: string, session?: ClientSession) =>
  WebhookModel.find({ organizationId, events: event, isActive: true }).session(session ?? null).exec();




