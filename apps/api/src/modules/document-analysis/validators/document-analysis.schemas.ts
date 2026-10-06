import { z } from 'zod';

export const documentAnalysisConfigSchema = z.object({
  modelVersion: z.string().max(50).optional(),
  language: z.string().max(10).default('es'),
  extractTables: z.boolean().default(true),
  extractKeyValuePairs: z.boolean().default(true),
  extractEntities: z.boolean().default(true),
  confidenceThreshold: z.coerce.number().min(0).max(1).default(0.7),
  customFields: z.array(z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['STRING', 'NUMBER', 'DATE', 'CURRENCY', 'PERCENTAGE', 'BOOLEAN']),
    description: z.string().max(200).optional(),
  })).optional(),
});

export const createDocumentAnalysisSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional(),
  type: z.enum(['OCR', 'INVOICE_EXTRACTION', 'CONTRACT_ANALYSIS', 'RECEIPT_PARSING', 'FORM_EXTRACTION', 'CLASSIFICATION', 'ENTITY_EXTRACTION', 'SUMMARIZATION', 'CUSTOM']),
  provider: z.enum(['AZURE_FORM_RECOGNIZER', 'AWS_TEXTRACT', 'GOOGLE_DOCUMENT_AI', 'OPENAI_VISION', 'CUSTOM']),
  input: z.object({
    documentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    attachmentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    fileUrl: z.string().max(500).optional(),
    mimeType: z.string().max(100).optional(),
    pages: z.coerce.number().int().positive().default(1),
  }).refine(data => data.documentId || data.attachmentId || data.fileUrl, { message: 'At least one input source required' }),
  configuration: documentAnalysisConfigSchema,
});

export const updateDocumentAnalysisSchema = createDocumentAnalysisSchema.partial().omit({ input: true }).extend({
  status: z.enum(['DRAFT', 'CONFIGURED', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED']).optional(),
});

export const documentAnalysisQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['OCR', 'INVOICE_EXTRACTION', 'CONTRACT_ANALYSIS', 'RECEIPT_PARSING', 'FORM_EXTRACTION', 'CLASSIFICATION', 'ENTITY_EXTRACTION', 'SUMMARIZATION', 'CUSTOM']).optional(),
  provider: z.enum(['AZURE_FORM_RECOGNIZER', 'AWS_TEXTRACT', 'GOOGLE_DOCUMENT_AI', 'OPENAI_VISION', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'CONFIGURED', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED']).optional(),
  search: z.string().max(160).optional(),
});

export const validateDocumentAnalysisSchema = z.object({
  validatedBy: z.string().regex(/^[0-9a-fA-F]{24}$/),
  corrections: z.array(z.object({
    field: z.string().max(100),
    originalValue: z.unknown(),
    correctedValue: z.unknown(),
  })).optional(),
});

export type CreateDocumentAnalysisInput = z.infer<typeof createDocumentAnalysisSchema>;
export type UpdateDocumentAnalysisInput = z.infer<typeof updateDocumentAnalysisSchema>;
export type DocumentAnalysisQuery = z.infer<typeof documentAnalysisQuerySchema>;
export type ValidateDocumentAnalysisInput = z.infer<typeof validateDocumentAnalysisSchema>;