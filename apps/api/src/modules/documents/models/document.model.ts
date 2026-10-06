import { Schema, model, type InferSchemaType } from 'mongoose';

const documentSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    category: { type: String, enum: ['CONTRACT', 'INVOICE', 'RECEIPT', 'REPORT', 'CERTIFICATE', 'LEGAL', 'HR', 'FINANCE', 'OPERATIONS', 'OTHER'], default: 'OTHER' },
    type: { type: String, enum: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'TXT', 'XML', 'JPG', 'PNG', 'OTHER'], default: 'PDF' },
    fileUrl: { type: String, required: true, trim: true, maxlength: 500 },
    fileSize: { type: Number, required: true, min: 0 },
    mimeType: { type: String, required: true, trim: true, maxlength: 100 },
    checksum: { type: String, trim: true, maxlength: 128 },
    version: { type: String, default: '1.0', trim: true, maxlength: 20 },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'ARCHIVED', 'EXPIRED'], default: 'DRAFT' },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    relatedEntityType: { type: String, trim: true, maxlength: 50 },
    relatedEntityId: { type: Schema.Types.ObjectId },
    accessLevel: { type: String, enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'], default: 'INTERNAL' },
    expiresAt: { type: Date },
    signedAt: { type: Date },
    signedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'documents' },
);

documentSchema.index({ organizationId: 1, code: 1 }, { unique: true });
documentSchema.index({ organizationId: 1, category: 1, status: 1 });
documentSchema.index({ organizationId: 1, relatedEntityType: 1, relatedEntityId: 1 });
documentSchema.index({ organizationId: 1, expiresAt: 1 });
documentSchema.index({ organizationId: 1, fileUrl: 1 });

export type Document = InferSchemaType<typeof documentSchema>;
export const DocumentModel = model<Document>('Document', documentSchema);