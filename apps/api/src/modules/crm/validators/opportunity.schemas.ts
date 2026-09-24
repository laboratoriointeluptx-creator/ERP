import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const decimal = z.string().regex(/^\d+(\.\d{1,4})?$/, 'Value must be a decimal string');

export const createOpportunitySchema = z.object({
  customerId: objectId.optional(),
  leadId: objectId.optional(),
  name: z.string().trim().min(1).max(160),
  estimatedValue: decimal,
  expectedCloseDate: z.coerce.date().optional(),
}).strict();

export const opportunityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  stage: z.enum(['PROSPECTING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type OpportunityQuery = z.infer<typeof opportunityQuerySchema>;
