import { z } from 'zod';

export const serviceOrderLineSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  description: z.string().min(1).max(500),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
  unitPrice: z.string().regex(/^\d+(\.\d{1,4})?$/),
  discount: z.string().regex(/^\d+(\.\d{1,4})?$/).default('0'),
  taxIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
});

export const createServiceOrderSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  ticketId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  contactId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).default('DRAFT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  type: z.enum(['INSTALLATION', 'MAINTENANCE', 'REPAIR', 'INSPECTION', 'CONSULTING']),
  scheduledDate: z.coerce.date().optional(),
  scheduledEndDate: z.coerce.date().optional(),
  assignedTechnicianId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  lines: z.array(serviceOrderLineSchema).optional(),
  serviceAddress: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  warrantyUntil: z.coerce.date().optional(),
  attachments: z.array(z.string()).optional(),
});

export const updateServiceOrderSchema = createServiceOrderSchema.partial().omit({ code: true });

export const serviceOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  assignedTechnicianId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  type: z.enum(['INSTALLATION', 'MAINTENANCE', 'REPAIR', 'INSPECTION', 'CONSULTING']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(160).optional(),
});

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;
export type UpdateServiceOrderInput = z.infer<typeof updateServiceOrderSchema>;
export type ServiceOrderQuery = z.infer<typeof serviceOrderQuerySchema>;
export type ServiceOrderLineInput = z.infer<typeof serviceOrderLineSchema>;