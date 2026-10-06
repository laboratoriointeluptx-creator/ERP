import { Schema, model, type InferSchemaType } from 'mongoose';

const agentSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['CONVERSATIONAL', 'TASK_AUTOMATION', 'DATA_ANALYSIS', 'REPORT_GENERATION', 'WORKFLOW_ORCHESTRATION', 'MONITORING', 'CUSTOM'], required: true },
    model: { type: String, required: true, trim: true, maxlength: 50 },
    version: { type: String, default: '1.0', trim: true, maxlength: 20 },
    status: { type: String, enum: ['DRAFT', 'CONFIGURED', 'TRAINING', 'DEPLOYED', 'ACTIVE', 'PAUSED', 'ARCHIVED', 'FAILED'], default: 'DRAFT' },
    instructions: { type: String, required: true, maxlength: 20000 },
    tools: [{
      name: { type: String, required: true, trim: true, maxlength: 100 },
      description: { type: String, required: true, trim: true, maxlength: 500 },
      type: { type: String, enum: ['FUNCTION', 'API', 'DATABASE_QUERY', 'WORKFLOW', 'SCRIPT', 'INTEGRATION'], required: true },
      schema: { type: Schema.Types.Mixed, required: true },
      parameters: { type: Schema.Types.Mixed },
      requiredPermissions: [{ type: String, trim: true, maxlength: 50 }],
      timeoutMs: { type: Number, default: 30000, min: 1000 },
    }],
    knowledgeBase: [{
      sourceType: { type: String, enum: ['DOCUMENT', 'DATABASE', 'API', 'WEB', 'CUSTOM'], required: true },
      sourceId: { type: Schema.Types.ObjectId },
      name: { type: String, required: true, trim: true, maxlength: 200 },
      description: { type: String, trim: true, maxlength: 500 },
      lastIndexedAt: { type: Date },
      chunkSize: { type: Number, default: 1000, min: 100 },
      overlap: { type: Number, default: 200, min: 0 },
    }],
    memory: {
      type: { type: String, enum: ['SHORT_TERM', 'LONG_TERM', 'HYBRID'], default: 'HYBRID' },
      maxTokens: { type: Number, default: 4000, min: 500 },
      retentionDays: { type: Number, default: 30, min: 1 },
      summaryEnabled: { type: Boolean, default: true },
    },
    guardrails: {
      allowedTopics: [{ type: String, trim: true, maxlength: 100 }],
      forbiddenTopics: [{ type: String, trim: true, maxlength: 100 }],
      maxResponseLength: { type: Number, default: 2000, min: 100 },
      requireConfirmationFor: [{ type: String, enum: ['DATA_MODIFICATION', 'FINANCIAL_TRANSACTION', 'EXTERNAL_API_CALL', 'USER_DATA_ACCESS', 'SYSTEM_CONFIG_CHANGE'] }],
      piiDetection: { type: Boolean, default: true },
      contentFilter: { type: Boolean, default: true },
    },
    execution: {
      maxIterations: { type: Number, default: 10, min: 1 },
      maxExecutionTimeMs: { type: Number, default: 120000, min: 5000 },
      parallelToolCalls: { type: Boolean, default: false },
      streamResponses: { type: Boolean, default: true },
    },
    metrics: {
      totalExecutions: { type: Number, default: 0 },
      successfulExecutions: { type: Number, default: 0 },
      failedExecutions: { type: Number, default: 0 },
      avgExecutionTimeMs: { type: Number, default: 0 },
      avgTokensUsed: { type: Number, default: 0 },
      userSatisfaction: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    },
    lastExecutedAt: { type: Date },
    deployedAt: { type: Date },
    deployedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'agents' },
);

agentSchema.index({ organizationId: 1, code: 1 }, { unique: true });
agentSchema.index({ organizationId: 1, type: 1, status: 1 });
agentSchema.index({ organizationId: 1, isActive: 1 });

export type Agent = InferSchemaType<typeof agentSchema>;
export const AgentModel = model<Agent>('Agent', agentSchema);