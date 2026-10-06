import { Schema, model, type InferSchemaType } from 'mongoose';

const apiKeySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    keyPrefix: { type: String, required: true, trim: true, maxlength: 20 },
    keyHash: { type: String, required: true, trim: true, maxlength: 128 },
    scopes: [{ type: String, required: true, trim: true, maxlength: 50 }],
    permissions: [{ type: String, required: true, trim: true, maxlength: 50 }],
    rateLimit: {
      requestsPerMinute: { type: Number, default: 60, min: 1 },
      requestsPerHour: { type: Number, default: 1000, min: 1 },
      requestsPerDay: { type: Number, default: 10000, min: 1 },
    },
    ipWhitelist: [{ type: String, trim: true, maxlength: 45 }],
    ipBlacklist: [{ type: String, trim: true, maxlength: 45 }],
    allowedOrigins: [{ type: String, trim: true, maxlength: 200 }],
    expiresAt: { type: Date },
    lastUsedAt: { type: Date },
    lastUsedIp: { type: String, trim: true, maxlength: 45 },
    usageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revokedAt: { type: Date },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    revocationReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: 'api_keys' },
);

apiKeySchema.index({ organizationId: 1, keyPrefix: 1 }, { unique: true });
apiKeySchema.index({ organizationId: 1, isActive: 1, expiresAt: 1 });
apiKeySchema.index({ keyHash: 1 }, { unique: true });

export type ApiKey = InferSchemaType<typeof apiKeySchema>;
export const ApiKeyModel = model<ApiKey>('ApiKey', apiKeySchema);