import { AssistantConversationModel } from '../models/assistant.model.js';
import type { AssistantQuery } from '../validators/assistant.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createAssistantConversation = (organizationId: string, userId: string, sessionId: string, session?: ClientSession) =>
  AssistantConversationModel.create([{ organizationId, userId, sessionId, status: 'ACTIVE', messages: [] }], session ? { session } : {}).then((d) => d[0]);

export const findAssistantConversation = (organizationId: string, id: string, session?: ClientSession) =>
  AssistantConversationModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findAssistantConversationBySession = (organizationId: string, sessionId: string, session?: ClientSession) =>
  AssistantConversationModel.findOne({ organizationId, sessionId }).session(session ?? null).exec();

export const listAssistantConversations = async (organizationId: string, query: AssistantQuery) => {
  const filter: FilterQuery<typeof AssistantConversationModel> = { organizationId };
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ title: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    AssistantConversationModel.find(filter).sort({ updatedAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    AssistantConversationModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const addMessage = (organizationId: string, conversationId: string, message: unknown, session?: ClientSession) =>
  AssistantConversationModel.findOneAndUpdate(
    { _id: conversationId, organizationId },
    { $push: { messages: message }, $set: { updatedAt: new Date() } },
    { new: true, session: session ?? null },
  ).exec();

export const updateConversationTitle = (organizationId: string, id: string, title: string, session?: ClientSession) =>
  AssistantConversationModel.findOneAndUpdate({ _id: id, organizationId }, { $set: { title } }, { new: true, session: session ?? null }).exec();

