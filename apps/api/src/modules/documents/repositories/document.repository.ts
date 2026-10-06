import { DocumentModel } from '../models/document.model.js';
import type { DocumentQuery, CreateDocumentInput, UpdateDocumentInput } from '../validators/document.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createDocument = (organizationId: string, input: CreateDocumentInput, session?: ClientSession) =>
  DocumentModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findDocument = (organizationId: string, id: string, session?: ClientSession) =>
  DocumentModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findDocumentByCode = (organizationId: string, code: string, session?: ClientSession) =>
  DocumentModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listDocuments = async (organizationId: string, query: DocumentQuery) => {
  const filter: FilterQuery<typeof DocumentModel> = { organizationId };
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.relatedEntityType) filter.relatedEntityType = query.relatedEntityType;
  if (query.relatedEntityId) filter.relatedEntityId = query.relatedEntityId;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    DocumentModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    DocumentModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateDocument = (organizationId: string, id: string, input: UpdateDocumentInput, session?: ClientSession) =>
  DocumentModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteDocument = (organizationId: string, id: string, session?: ClientSession) =>
  DocumentModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




