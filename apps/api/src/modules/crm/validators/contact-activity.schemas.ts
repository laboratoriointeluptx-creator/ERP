import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createContactSchema = z.object({
  customerId: objectId,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  position: z.string().trim().max(120).optional(),
  primary: z.boolean().default(false),
}).strict();

export const createActivitySchema = z.object({
  customerId: objectId.optional(),
  leadId: objectId.optional(),
  opportunityId: objectId.optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE']),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  dueAt: z.coerce.date().optional(),
}).strict();

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
