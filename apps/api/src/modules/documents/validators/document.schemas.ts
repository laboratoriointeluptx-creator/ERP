import { z } from 'zod';

export const createDocumentSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['CONTRACT', 'INVOICE', 'RECEIPT', 'REPORT', 'CERTIFICATE', 'LEGAL', 'HR', 'FINANCE', 'OPERATIONS', 'OTHER']).default('OTHER'),
  type: z.enum(['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'TXT', 'XML', 'JPG', 'PNG', 'OTHER']).default('PDF'),
  fileUrl: z.string().min(1).max(500),
  fileSize: z.coerce.number().int().nonnegative(),
  mimeType: z.string().min(1).max(100),
  checksum: z.string().max(128).optional(),
  version: z.string().max(20).default('1.0'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'EXPIRED']).default('DRAFT'),
  tags: z.array(z.string().max(50)).optional(),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  accessLevel: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).default('INTERNAL'),
  expiresAt: z.coerce.date().optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const documentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  category: z.enum(['CONTRACT', 'INVOICE', 'RECEIPT', 'REPORT', 'CERTIFICATE', 'LEGAL', 'HR', 'FINANCE', 'OPERATIONS', 'OTHER']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'EXPIRED']).optional(),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(200).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentQuery = z.infer<typeof documentQuerySchema>;