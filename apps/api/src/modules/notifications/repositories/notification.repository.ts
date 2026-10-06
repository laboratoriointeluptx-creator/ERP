import { NotificationModel } from '../models/notification.model.js';
import type { NotificationQuery, CreateNotificationInput, UpdateNotificationInput } from '../validators/notification.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createNotification = (organizationId: string, input: CreateNotificationInput, session?: ClientSession) =>
  NotificationModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findNotification = (organizationId: string, id: string, session?: ClientSession) =>
  NotificationModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findNotificationByCode = (organizationId: string, code: string, session?: ClientSession) =>
  NotificationModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listNotifications = async (organizationId: string, query: NotificationQuery) => {
  const filter: FilterQuery<typeof NotificationModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.channel) filter.channel = query.channel;
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    NotificationModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    NotificationModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateNotification = (organizationId: string, id: string, input: UpdateNotificationInput, session?: ClientSession) =>
  NotificationModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteNotification = (organizationId: string, id: string, session?: ClientSession) =>
  NotificationModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const findNotificationsByTrigger = (organizationId: string, event: string, module: string, session?: ClientSession) =>
  NotificationModel.find({ organizationId, 'trigger.event': event, 'trigger.module': module, status: 'ACTIVE' }).session(session ?? null).exec();

export const recordNotificationDelivery = (organizationId: string, id: string, delivered: boolean) =>
  NotificationModel.updateOne(
    { _id: id, organizationId },
    {
      $inc: delivered ? { sentCount: 1 } : { failedCount: 1 },
      ...(delivered ? { $set: { lastSentAt: new Date() } } : {}),
    },
  ).exec();




