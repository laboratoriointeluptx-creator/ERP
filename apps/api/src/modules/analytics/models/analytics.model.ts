import { Schema, model, type InferSchemaType } from 'mongoose';

const analyticsEventSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    eventName: { type: String, required: true, trim: true, maxlength: 100 },
    eventCategory: { type: String, trim: true, maxlength: 50 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String, trim: true, maxlength: 128 },
    properties: { type: Schema.Types.Mixed },
    timestamp: { type: Date, required: true, default: Date.now },
    pageUrl: { type: String, trim: true, maxlength: 500 },
    referrer: { type: String, trim: true, maxlength: 500 },
    userAgent: { type: String, trim: true, maxlength: 500 },
    ip: { type: String, trim: true, maxlength: 45 },
    country: { type: String, trim: true, maxlength: 2 },
    deviceType: { type: String, enum: ['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN'], default: 'UNKNOWN' },
  },
  { timestamps: false, collection: 'analytics_events' },
);

analyticsEventSchema.index({ organizationId: 1, eventName: 1, timestamp: -1 });
analyticsEventSchema.index({ organizationId: 1, userId: 1, timestamp: -1 });
analyticsEventSchema.index({ organizationId: 1, sessionId: 1 });
analyticsEventSchema.index({ organizationId: 1, timestamp: -1 });

const kpiSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500 },
    formula: { type: String, required: true, trim: true, maxlength: 1000 },
    unit: { type: String, trim: true, maxlength: 20 },
    target: { type: String, match: /^-?\d+(\.\d{1,4})?$/ },
    warningThreshold: { type: String, match: /^-?\d+(\.\d{1,4})?$/ },
    criticalThreshold: { type: String, match: /^-?\d+(\.\d{1,4})?$/ },
    frequency: { type: String, enum: ['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'], default: 'DAILY' },
    dataSource: { type: String, required: true, trim: true, maxlength: 100 },
    isActive: { type: Boolean, default: true },
    lastCalculatedAt: { type: Date },
    lastValue: { type: String, match: /^-?\d+(\.\d{1,4})?$/ },
    trend: { type: String, enum: ['UP', 'DOWN', 'STABLE', 'UNKNOWN'], default: 'UNKNOWN' },
  },
  { timestamps: true, collection: 'kpis' },
);

kpiSchema.index({ organizationId: 1, code: 1 }, { unique: true });
kpiSchema.index({ organizationId: 1, isActive: 1, frequency: 1 });

export type AnalyticsEvent = InferSchemaType<typeof analyticsEventSchema>;
export type KPI = InferSchemaType<typeof kpiSchema>;
export const AnalyticsEventModel = model<AnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);
export const KpiModel = model<KPI>('KPI', kpiSchema);