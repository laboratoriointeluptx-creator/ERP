import { z } from 'zod';

export const agentToolSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['FUNCTION', 'API', 'DATABASE_QUERY', 'WORKFLOW', 'SCRIPT', 'INTEGRATION']),
  schema: z.unknown(),
  parameters: z.unknown().optional(),
  requiredPermissions: z.array(z.string().max(50)).optional(),
  timeoutMs: z.coerce.number().int().min(1000).default(30000),
});

export const agentKnowledgeBaseSchema = z.object({
  sourceType: z.enum(['DOCUMENT', 'DATABASE', 'API', 'WEB', 'CUSTOM']),
  sourceId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  chunkSize: z.coerce.number().int().min(100).default(1000),
  overlap: z.coerce.number().int().min(0).default(200),
});

export const agentGuardrailsSchema = z.object({
  allowedTopics: z.array(z.string().max(100)).optional(),
  forbiddenTopics: z.array(z.string().max(100)).optional(),
  maxResponseLength: z.coerce.number().int().min(100).default(2000),
  requireConfirmationFor: z.array(z.enum(['DATA_MODIFICATION', 'FINANCIAL_TRANSACTION', 'EXTERNAL_API_CALL', 'USER_DATA_ACCESS', 'SYSTEM_CONFIG_CHANGE'])).optional(),
  piiDetection: z.boolean().default(true),
  contentFilter: z.boolean().default(true),
});

export const agentExecutionSchema = z.object({
  maxIterations: z.coerce.number().int().min(1).default(10),
  maxExecutionTimeMs: z.coerce.number().int().min(5000).default(120000),
  parallelToolCalls: z.boolean().default(false),
  streamResponses: z.boolean().default(true),
});

export const agentMemorySchema = z.object({
  type: z.enum(['SHORT_TERM', 'LONG_TERM', 'HYBRID']).default('HYBRID'),
  maxTokens: z.coerce.number().int().min(500).default(4000),
  retentionDays: z.coerce.number().int().min(1).default(30),
  summaryEnabled: z.boolean().default(true),
});

export const createAgentSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  type: z.enum(['CONVERSATIONAL', 'TASK_AUTOMATION', 'DATA_ANALYSIS', 'REPORT_GENERATION', 'WORKFLOW_ORCHESTRATION', 'MONITORING', 'CUSTOM']),
  model: z.string().min(1).max(50),
  version: z.string().max(20).default('1.0'),
  instructions: z.string().min(1).max(20000),
  tools: z.array(agentToolSchema).optional(),
  knowledgeBase: z.array(agentKnowledgeBaseSchema).optional(),
  memory: agentMemorySchema.optional(),
  guardrails: agentGuardrailsSchema.optional(),
  execution: agentExecutionSchema.optional(),
});

export const updateAgentSchema = createAgentSchema.partial().extend({
  status: z.enum(['DRAFT', 'CONFIGURED', 'TRAINING', 'DEPLOYED', 'ACTIVE', 'PAUSED', 'ARCHIVED', 'FAILED']).optional(),
  isActive: z.boolean().optional(),
  deployedAt: z.date().optional(),
  deployedBy: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  metrics: z.object({
    totalExecutions: z.number().int().optional(),
    successfulExecutions: z.number().int().optional(),
    failedExecutions: z.number().int().optional(),
    avgExecutionTimeMs: z.number().optional(),
    avgTokensUsed: z.number().optional(),
    userSatisfaction: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  }).partial().optional(),
});

export const agentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['CONVERSATIONAL', 'TASK_AUTOMATION', 'DATA_ANALYSIS', 'REPORT_GENERATION', 'WORKFLOW_ORCHESTRATION', 'MONITORING', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'CONFIGURED', 'TRAINING', 'DEPLOYED', 'ACTIVE', 'PAUSED', 'ARCHIVED', 'FAILED']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type AgentQuery = z.infer<typeof agentQuerySchema>;
export type AgentToolInput = z.infer<typeof agentToolSchema>;
export type AgentKnowledgeBaseInput = z.infer<typeof agentKnowledgeBaseSchema>;