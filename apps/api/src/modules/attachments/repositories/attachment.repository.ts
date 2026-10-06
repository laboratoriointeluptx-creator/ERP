import { AttachmentModel } from '../models/attachment.model.js';
import type { AttachmentQuery, CreateAttachmentInput } from '../validators/attachment.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createAttachment = (organizationId: string, input: CreateAttachmentInput, session?: ClientSession) =>
  AttachmentModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findAttachment = (organizationId: string, id: string, session?: ClientSession) =>
  AttachmentModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const listAttachments = async (organizationId: string, query: AttachmentQuery) => {
  const filter: FilterQuery<typeof AttachmentModel> = { organizationId };
  if (query.entityType) filter.entityType = query.entityType;
  if (query.entityId) filter.entityId = query.entityId;
  if (query.uploadedBy) filter.uploadedBy = query.uploadedBy;
  if (query.search) filter.$or = [{ fileName: { $regex: query.search, $options: 'i' } }, { originalName: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    AttachmentModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    AttachmentModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const deleteAttachment = (organizationId: string, id: string, session?: ClientSession) =>
  AttachmentModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

