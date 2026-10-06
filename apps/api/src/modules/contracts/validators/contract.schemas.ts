import { z } from 'zod';

export const createContractSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['SALES', 'PURCHASE', 'SERVICE', 'EMPLOYMENT', 'LEASE', 'PARTNERSHIP', 'NDA', 'OTHER']).default('OTHER'),
  status: z.enum(['DRAFT', 'NEGOTIATING', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']).default('DRAFT'),
  approvedBy: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  partyA: z.object({
    name: z.string().min(1).max(200),
    taxId: z.string().max(30).optional(),
    address: z.string().max(500).optional(),
    contactName: z.string().max(120).optional(),
    contactEmail: z.string().email().max(160).optional(),
  }),
  partyB: z.object({
    name: z.string().min(1).max(200),
    taxId: z.string().max(30).optional(),
    address: z.string().max(500).optional(),
    contactName: z.string().max(120).optional(),
    contactEmail: z.string().email().max(160).optional(),
  }),
  effectiveDate: z.coerce.date(),
  expirationDate: z.coerce.date().optional(),
  autoRenew: z.boolean().default(false),
  renewalPeriod: z.string().max(50).optional(),
  value: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  currency: z.string().length(3).toUpperCase().default('MXN'),
  billingFrequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY']).default('ONE_TIME'),
  documentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  termsAndConditions: z.string().max(10000).optional(),
});

export const updateContractSchema = createContractSchema.partial();

export const contractQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['DRAFT', 'NEGOTIATING', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']).optional(),
  type: z.enum(['SALES', 'PURCHASE', 'SERVICE', 'EMPLOYMENT', 'LEASE', 'PARTNERSHIP', 'NDA', 'OTHER']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(200).optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractQuery = z.infer<typeof contractQuerySchema>;