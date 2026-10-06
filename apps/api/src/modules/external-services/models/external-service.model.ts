import { Schema, model, type InferSchemaType } from 'mongoose';

const externalServiceSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['SAT', 'BANK', 'PAYMENT_GATEWAY', 'SHIPPING_CARRIER', 'EMAIL_PROVIDER', 'SMS_PROVIDER', 'STORAGE', 'AI_SERVICE', 'OTHER'], required: true },
    provider: { type: String, required: true, trim: true, maxlength: 50 },
    baseUrl: { type: String, trim: true, maxlength: 500 },
    authType: { type: String, enum: ['NONE', 'API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH', 'OAUTH2', 'CERTIFICATE', 'CUSTOM'], default: 'NONE' },
    credentials: {
      apiKey: { type: String, trim: true, maxlength: 200 },
      apiSecret: { type: String, trim: true, maxlength: 200 },
      clientId: { type: String, trim: true, maxlength: 200 },
      clientSecret: { type: String, trim: true, maxlength: 200 },
      username: { type: String, trim: true, maxlength: 100 },
      password: { type: String, trim: true, maxlength: 200 },
      certificate: { type: String, trim: true, maxlength: 5000 },
      privateKey: { type: String, trim: true, maxlength: 5000 },
      custom: { type: Schema.Types.Mixed },
    },
    endpoints: [{
      name: { type: String, required: true, trim: true, maxlength: 100 },
      method: { type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], required: true },
      path: { type: String, required: true, trim: true, maxlength: 500 },
      headers: { type: Schema.Types.Mixed },
      requestSchema: { type: Schema.Types.Mixed },
      responseSchema: { type: Schema.Types.Mixed },
      timeoutMs: { type: Number, default: 30000, min: 1000 },
      retryPolicy: {
        maxRetries: { type: Number, default: 3 },
        retryDelayMs: { type: Number, default: 1000 },
        retryOnStatusCodes: [{ type: Number }],
      },
    }],
    rateLimit: {
      requestsPerSecond: { type: Number, default: 10, min: 1 },
      requestsPerMinute: { type: Number, default: 100, min: 1 },
      burstLimit: { type: Number, default: 20, min: 1 },
    },
    healthCheck: {
      enabled: { type: Boolean, default: true },
      endpoint: { type: String, trim: true, maxlength: 500 },
      intervalSeconds: { type: Number, default: 300, min: 30 },
      timeoutSeconds: { type: Number, default: 10 },
      expectedStatus: { type: Number, default: 200 },
    },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    lastHealthCheck: { type: Date },
    healthStatus: { type: String, enum: ['HEALTHY', 'DEGRADED', 'DOWN', 'UNKNOWN'], default: 'UNKNOWN' },
    healthDetails: { type: Schema.Types.Mixed },
    usageStats: {
      totalCalls: { type: Number, default: 0 },
      successfulCalls: { type: Number, default: 0 },
      failedCalls: { type: Number, default: 0 },
      avgResponseTimeMs: { type: Number, default: 0 },
    },
  },
  { timestamps: true, collection: 'external_services' },
);

externalServiceSchema.index({ organizationId: 1, code: 1 }, { unique: true });
externalServiceSchema.index({ organizationId: 1, type: 1, provider: 1 });
externalServiceSchema.index({ organizationId: 1, isActive: 1, isDefault: 1 });

export type ExternalService = InferSchemaType<typeof externalServiceSchema>;
export const ExternalServiceModel = model<ExternalService>('ExternalService', externalServiceSchema);