import { z } from 'zod';

export const createTicketSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum(['INCIDENT', 'REQUEST', 'PROBLEM', 'CHANGE']).default('INCIDENT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  contactId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  groupId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  slaId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  source: z.enum(['EMAIL', 'PHONE', 'PORTAL', 'CHAT', 'WALK_IN', 'API']).default('PORTAL'),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  tags: z.array(z.string().max(50)).optional(),
  relatedTicketIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
});

export const updateTicketSchema = createTicketSchema.partial().omit({ code: true }).extend({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_THIRD_PARTY', 'RESOLVED', 'CLOSED']).optional(),
});

export const ticketQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_THIRD_PARTY', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  category: z.enum(['INCIDENT', 'REQUEST', 'PROBLEM', 'CHANGE']).optional(),
  assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  slaId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(200).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketQuery = z.infer<typeof ticketQuerySchema>;