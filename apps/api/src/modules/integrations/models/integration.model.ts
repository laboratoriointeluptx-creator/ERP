import { Schema, model, type InferSchemaType } from 'mongoose';

const integrationSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['ECOMMERCE', 'MARKETPLACE', 'ACCOUNTING', 'CRM', 'ERP', 'PAYMENT', 'SHIPPING', 'TAX', 'BANKING', 'CUSTOM'], required: true },
    provider: { type: String, required: true, trim: true, maxlength: 50 },
    version: { type: String, default: '1.0', trim: true, maxlength: 20 },
    status: { type: String, enum: ['DRAFT', 'CONFIGURED', 'CONNECTED', 'SYNCING', 'ERROR', 'DISABLED'], default: 'DRAFT' },
    config: {
      baseUrl: { type: String, trim: true, maxlength: 500 },
      apiKey: { type: String, trim: true, maxlength: 200 },
      apiSecret: { type: String, trim: true, maxlength: 200 },
      accessToken: { type: String, trim: true, maxlength: 500 },
      refreshToken: { type: String, trim: true, maxlength: 500 },
      clientId: { type: String, trim: true, maxlength: 200 },
      clientSecret: { type: String, trim: true, maxlength: 200 },
      scopes: [{ type: String, trim: true, maxlength: 100 }],
      customFields: { type: Schema.Types.Mixed },
    },
    syncSettings: {
      autoSync: { type: Boolean, default: false },
      syncFrequency: { type: String, enum: ['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MANUAL'], default: 'MANUAL' },
      syncDirection: { type: String, enum: ['IMPORT', 'EXPORT', 'BIDIRECTIONAL'], default: 'BIDIRECTIONAL' },
      lastSyncAt: { type: Date },
      lastSyncStatus: { type: String, enum: ['SUCCESS', 'FAILED', 'PARTIAL', 'IN_PROGRESS'] },
      lastSyncError: { type: String, maxlength: 2000 },
      conflictResolution: { type: String, enum: ['LOCAL_WINS', 'REMOTE_WINS', 'MERGE', 'MANUAL'], default: 'MANUAL' },
      batchSize: { type: Number, default: 100, min: 1, max: 1000 },
    },
    mapping: {
      entities: [{
        localEntity: { type: String, required: true, trim: true, maxlength: 50 },
        remoteEntity: { type: String, required: true, trim: true, maxlength: 50 },
        fieldMappings: [{
          localField: { type: String, required: true, trim: true, maxlength: 50 },
          remoteField: { type: String, required: true, trim: true, maxlength: 50 },
          transform: { type: String, trim: true, maxlength: 200 },
        }],
      }],
    },
    webhookUrl: { type: String, trim: true, maxlength: 500 },
    webhookSecret: { type: String, trim: true, maxlength: 200 },
    isActive: { type: Boolean, default: true },
    healthCheckUrl: { type: String, trim: true, maxlength: 500 },
    lastHealthCheck: { type: Date },
    healthStatus: { type: String, enum: ['HEALTHY', 'DEGRADED', 'DOWN', 'UNKNOWN'], default: 'UNKNOWN' },
  },
  { timestamps: true, collection: 'integrations' },
);

integrationSchema.index({ organizationId: 1, code: 1 }, { unique: true });
integrationSchema.index({ organizationId: 1, provider: 1, status: 1 });
integrationSchema.index({ organizationId: 1, type: 1 });

export type Integration = InferSchemaType<typeof integrationSchema>;
export const IntegrationModel = model<Integration>('Integration', integrationSchema);