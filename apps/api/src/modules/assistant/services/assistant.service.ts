import { HttpError } from '../../../shared/http.js';
import { createAssistantConversation, findAssistantConversation, findAssistantConversationBySession, listAssistantConversations, addMessage, updateConversationTitle } from '../repositories/assistant.repository.js';
import type { AssistantQuery, ChatMessageInput } from '../validators/assistant.schemas.js';

export const startConversation = async (organizationId: string, userId: string, sessionId: string) => {
  const existing = await findAssistantConversationBySession(organizationId, sessionId);
  if (existing) return existing;
  return createAssistantConversation(organizationId, userId, sessionId);
};

export const getConversations = (organizationId: string, query: AssistantQuery) => listAssistantConversations(organizationId, query);

export const getConversation = (organizationId: string, id: string) => findAssistantConversation(organizationId, id);

export const sendMessage = async (organizationId: string, conversationId: string, input: ChatMessageInput) => {
  const conversation = await findAssistantConversation(organizationId, conversationId);
  if (!conversation) throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
  
  const userMessage = {
    role: 'USER',
    content: input.message,
    timestamp: new Date(),
  };
  
  await addMessage(organizationId, conversationId, userMessage);
  
  // AI response logic would go here
  const assistantMessage = {
    role: 'ASSISTANT',
    content: 'AI response would be generated here',
    timestamp: new Date(),
  };
  
  await addMessage(organizationId, conversationId, assistantMessage);
  
  return { conversationId, userMessage, assistantMessage };
};

export const updateTitle = (organizationId: string, id: string, title: string) =>
  updateConversationTitle(organizationId, id, title);