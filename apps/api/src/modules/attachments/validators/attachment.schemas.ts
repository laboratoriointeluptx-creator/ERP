import { z } from 'zod';

export const createAttachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  fileSize: z.coerce.number().int().nonnegative(),
  fileUrl: z.string().min(1).max(500),
  checksum: z.string().max(128).optional(),
  entityType: z.string().min(1).max(50),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  uploadedBy: z.string().regex(/^[0-9a-fA-F]{24}$/),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().max(50)).optional(),
});

export const attachmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  entityType: z.string().max(50).optional(),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  uploadedBy: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(255).optional(),
});

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;
export type AttachmentQuery = z.infer<typeof attachmentQuerySchema>;