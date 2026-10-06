import { Schema, model, type InferSchemaType } from 'mongoose';

const documentAnalysisSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['OCR', 'INVOICE_EXTRACTION', 'CONTRACT_ANALYSIS', 'RECEIPT_PARSING', 'FORM_EXTRACTION', 'CLASSIFICATION', 'ENTITY_EXTRACTION', 'SUMMARIZATION', 'CUSTOM'], required: true },
    provider: { type: String, enum: ['AZURE_FORM_RECOGNIZER', 'AWS_TEXTRACT', 'GOOGLE_DOCUMENT_AI', 'OPENAI_VISION', 'CUSTOM'], required: true },
    status: { type: String, enum: ['DRAFT', 'CONFIGURED', 'PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED'], default: 'DRAFT' },
    input: {
      documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
      attachmentId: { type: Schema.Types.ObjectId, ref: 'Attachment' },
      fileUrl: { type: String, trim: true, maxlength: 500 },
      mimeType: { type: String, trim: true, maxlength: 100 },
      pages: { type: Number, default: 1 },
    },
    configuration: {
      modelVersion: { type: String, trim: true, maxlength: 50 },
      language: { type: String, trim: true, maxlength: 10, default: 'es' },
      extractTables: { type: Boolean, default: true },
      extractKeyValuePairs: { type: Boolean, default: true },
      extractEntities: { type: Boolean, default: true },
      confidenceThreshold: { type: Number, default: 0.7, min: 0, max: 1 },
      customFields: [{
        name: { type: String, required: true, trim: true, maxlength: 50 },
        type: { type: String, enum: ['STRING', 'NUMBER', 'DATE', 'CURRENCY', 'PERCENTAGE', 'BOOLEAN'], required: true },
        description: { type: String, trim: true, maxlength: 200 },
      }],
    },
    results: {
      extractedData: { type: Schema.Types.Mixed },
      tables: [{
        pageNumber: { type: Number },
        rows: { type: Number },
        columns: { type: Number },
        data: { type: Schema.Types.Mixed },
        confidence: { type: Number },
      }],
      keyValuePairs: [{
        key: { type: String, trim: true, maxlength: 100 },
        value: { type: String, trim: true, maxlength: 500 },
        confidence: { type: Number },
        pageNumber: { type: Number },
        boundingBox: { type: Schema.Types.Mixed },
      }],
      entities: [{
        type: { type: String, trim: true, maxlength: 50 },
        text: { type: String, trim: true, maxlength: 200 },
        confidence: { type: Number },
        pageNumber: { type: Number },
        boundingBox: { type: Schema.Types.Mixed },
      }],
      summary: { type: String, maxlength: 5000 },
      overallConfidence: { type: Number },
    },
    validation: {
      isValidated: { type: Boolean, default: false },
      validatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      validatedAt: { type: Date },
      corrections: [{
        field: { type: String, trim: true, maxlength: 100 },
        originalValue: { type: Schema.Types.Mixed },
        correctedValue: { type: Schema.Types.Mixed },
        correctedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        correctedAt: { type: Date },
      }],
    },
    processingTimeMs: { type: Number },
    errorMessage: { type: String, maxlength: 2000 },
    cost: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    currency: { type: String, length: 3, default: 'USD' },
  },
  { timestamps: true, collection: 'document_analyses' },
);

documentAnalysisSchema.index({ organizationId: 1, code: 1 }, { unique: true });
documentAnalysisSchema.index({ organizationId: 1, type: 1, status: 1 });
documentAnalysisSchema.index({ organizationId: 1, 'input.documentId': 1 });
documentAnalysisSchema.index({ organizationId: 1, 'input.attachmentId': 1 });
documentAnalysisSchema.index({ organizationId: 1, 'validation.isValidated': 1 });

export type DocumentAnalysis = InferSchemaType<typeof documentAnalysisSchema>;
export const DocumentAnalysisModel = model<DocumentAnalysis>('DocumentAnalysis', documentAnalysisSchema);