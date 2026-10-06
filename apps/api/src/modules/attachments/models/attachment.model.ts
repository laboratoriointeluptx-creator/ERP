import { Schema, model, type InferSchemaType } from 'mongoose';

const attachmentSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    fileName: { type: String, required: true, trim: true, maxlength: 255 },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true, trim: true, maxlength: 100 },
    fileSize: { type: Number, required: true, min: 0 },
    fileUrl: { type: String, required: true, trim: true, maxlength: 500 },
    checksum: { type: String, trim: true, maxlength: 128 },
    entityType: { type: String, required: true, trim: true, maxlength: 50 },
    entityId: { type: Schema.Types.ObjectId, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, trim: true, maxlength: 500 },
    isPublic: { type: Boolean, default: false },
    tags: [{ type: String, trim: true, maxlength: 50 }],
  },
  { timestamps: true, collection: 'attachments' },
);

attachmentSchema.index({ organizationId: 1, entityType: 1, entityId: 1 });
attachmentSchema.index({ organizationId: 1, uploadedBy: 1, createdAt: -1 });
attachmentSchema.index({ organizationId: 1, checksum: 1 });

export type Attachment = InferSchemaType<typeof attachmentSchema>;
export const AttachmentModel = model<Attachment>('Attachment', attachmentSchema);