import { Schema, model, type InferSchemaType } from 'mongoose';

const webhookSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    secret: { type: String, required: true, trim: true, maxlength: 200 },
    events: [{ type: String, required: true, trim: true, maxlength: 100 }],
    isActive: { type: Boolean, default: true },
    headers: { type: Schema.Types.Mixed },
    retryPolicy: {
      maxRetries: { type: Number, default: 3 },
      retryDelaySeconds: { type: Number, default: 30 },
      backoffMultiplier: { type: Number, default: 2 },
      maxRetryDelaySeconds: { type: Number, default: 3600 },
    },
    timeoutSeconds: { type: Number, default: 30, min: 5, max: 300 },
    contentType: { type: String, enum: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'], default: 'application/json' },
    signatureHeader: { type: String, default: 'X-Webhook-Signature', trim: true, maxlength: 50 },
    filter: {
      organizationIds: [{ type: Schema.Types.ObjectId }],
      modules: [{ type: String, trim: true, maxlength: 50 }],
      eventTypes: [{ type: String, trim: true, maxlength: 50 }],
    },
    lastTriggeredAt: { type: Date },
    lastSuccessAt: { type: Date },
    lastFailureAt: { type: Date },
    consecutiveFailures: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    failedDeliveries: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'webhooks' },
);

webhookSchema.index({ organizationId: 1, code: 1 }, { unique: true });
webhookSchema.index({ organizationId: 1, isActive: 1 });
webhookSchema.index({ organizationId: 1, events: 1 });

export type Webhook = InferSchemaType<typeof webhookSchema>;
export const WebhookModel = model<Webhook>('Webhook', webhookSchema);