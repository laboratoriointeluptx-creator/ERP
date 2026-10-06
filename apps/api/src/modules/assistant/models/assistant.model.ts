import { Schema, model, type InferSchemaType } from 'mongoose';

const assistantConversationSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true, trim: true, maxlength: 128 },
    title: { type: String, trim: true, maxlength: 200 },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED', 'DELETED'], default: 'ACTIVE' },
    messages: [{
      role: { type: String, enum: ['USER', 'ASSISTANT', 'SYSTEM', 'TOOL'], required: true },
      content: { type: String, required: true, maxlength: 50000 },
      toolCalls: [{
        name: { type: String, trim: true, maxlength: 100 },
        arguments: { type: Schema.Types.Mixed },
        result: { type: Schema.Types.Mixed },
        error: { type: String, maxlength: 2000 },
      }],
      metadata: { type: Schema.Types.Mixed },
      timestamp: { type: Date, default: Date.now },
    }],
    context: {
      modules: [{ type: String, trim: true, maxlength: 50 }],
      entityIds: { type: Schema.Types.Mixed },
      filters: { type: Schema.Types.Mixed },
    },
    modelUsed: { type: String, trim: true, maxlength: 50 },
    totalTokens: { type: Number, default: 0 },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'assistant_conversations' },
);

assistantConversationSchema.index({ organizationId: 1, userId: 1, updatedAt: -1 });
assistantConversationSchema.index({ organizationId: 1, sessionId: 1 }, { unique: true });
assistantConversationSchema.index({ organizationId: 1, status: 1 });

export type AssistantConversation = InferSchemaType<typeof assistantConversationSchema>;
export const AssistantConversationModel = model<AssistantConversation>('AssistantConversation', assistantConversationSchema);