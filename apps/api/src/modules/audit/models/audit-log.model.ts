import { Schema, model, type InferSchemaType } from 'mongoose';

const auditLogSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true, maxlength: 120 },
    module: { type: String, required: true, trim: true, maxlength: 80 },
    entity: { type: String, required: true, trim: true, maxlength: 80 },
    entityId: { type: String, required: true, trim: true, maxlength: 80 },
    ip: { type: String, trim: true, maxlength: 64 },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'audit_logs' },
);

auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, entity: 1, entityId: 1, createdAt: -1 });

export type AuditLog = InferSchemaType<typeof auditLogSchema>;
export const AuditLogModel = model<AuditLog>('AuditLog', auditLogSchema);
