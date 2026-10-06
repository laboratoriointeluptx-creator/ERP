import { Schema, model, type InferSchemaType } from 'mongoose';

const notificationSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    type: { type: String, enum: ['EMAIL', 'PUSH', 'SMS', 'IN_APP', 'WEBHOOK', 'SLACK', 'TEAMS'], required: true },
    channel: { type: String, enum: ['EMAIL', 'PUSH', 'SMS', 'IN_APP', 'WEBHOOK'], required: true },
    priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'], default: 'DRAFT' },
    trigger: {
      event: { type: String, required: true, trim: true, maxlength: 100 },
      module: { type: String, required: true, trim: true, maxlength: 50 },
      conditions: { type: Schema.Types.Mixed },
    },
    template: {
      subject: { type: String, trim: true, maxlength: 200 },
      body: { type: String, required: true, maxlength: 10000 },
      variables: [{ name: { type: String, trim: true, maxlength: 50 }, type: { type: String, enum: ['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'OBJECT'] } }],
    },
    recipients: {
      userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      roleIds: [{ type: String, trim: true, maxlength: 50 }],
      emails: [{ type: String, trim: true, maxlength: 160 }],
      phones: [{ type: String, trim: true, maxlength: 30 }],
    },
    scheduling: {
      sendImmediately: { type: Boolean, default: true },
      delayMinutes: { type: Number, default: 0, min: 0 },
      timezone: { type: String, trim: true, maxlength: 50, default: 'UTC' },
      businessHoursOnly: { type: Boolean, default: false },
      cronExpression: { type: String, trim: true, maxlength: 100 },
    },
    delivery: {
      provider: { type: String, trim: true, maxlength: 50 },
      providerConfig: { type: Schema.Types.Mixed },
      retryPolicy: {
        maxRetries: { type: Number, default: 3 },
        retryDelayMinutes: { type: Number, default: 5 },
        backoffMultiplier: { type: Number, default: 2 },
      },
    },
    tracking: {
      openTracking: { type: Boolean, default: true },
      clickTracking: { type: Boolean, default: true },
      unsubscribeLink: { type: Boolean, default: true },
    },
    lastSentAt: { type: Date },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'notifications' },
);

notificationSchema.index({ organizationId: 1, code: 1 }, { unique: true });
notificationSchema.index({ organizationId: 1, type: 1, status: 1 });
notificationSchema.index({ organizationId: 1, 'trigger.event': 1, status: 1 });

export type Notification = InferSchemaType<typeof notificationSchema>;
export const NotificationModel = model<Notification>('Notification', notificationSchema);