import { z } from 'zod';

export const assistantQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
  search: z.string().max(200).optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().max(128).optional(),
  context: z.object({
    modules: z.array(z.string().max(50)).optional(),
    entityIds: z.unknown().optional(),
    filters: z.unknown().optional(),
  }).optional(),
});

export type AssistantQuery = z.infer<typeof assistantQuerySchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;