import { Schema, model, type InferSchemaType } from 'mongoose';

const anomalySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['STATISTICAL', 'ML_BASED', 'RULE_BASED', 'ISOLATION_FOREST', 'AUTOENCODER', 'CUSTOM'], required: true },
    status: { type: String, enum: ['DRAFT', 'TRAINING', 'TRAINED', 'MONITORING', 'ARCHIVED', 'FAILED'], default: 'DRAFT' },
    target: {
      entityType: { type: String, required: true, trim: true, maxlength: 50 },
      entityId: { type: Schema.Types.ObjectId },
      metricField: { type: String, required: true, trim: true, maxlength: 50 },
      dimensions: [{ type: String, trim: true, maxlength: 50 }],
      filters: { type: Schema.Types.Mixed },
    },
    model: {
      algorithm: { type: String, required: true, trim: true, maxlength: 50 },
      parameters: { type: Schema.Types.Mixed },
      trainingDataRange: {
        startDate: { type: Date },
        endDate: { type: Date },
      },
      metrics: {
        precision: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        recall: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        f1Score: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        auc: { type: String, match: /^\d+(\.\d{1,4})?$/ },
      },
      trainedAt: { type: Date },
    },
    detection: {
      threshold: { type: String, match: /^\d+(\.\d{1,4})?$/ },
      sensitivity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
      windowSize: { type: Number, default: 100, min: 10 },
      minAnomalyGap: { type: Number, default: 1 },
      alertOnDetection: { type: Boolean, default: true },
      notificationChannels: [{ type: String, enum: ['EMAIL', 'PUSH', 'IN_APP', 'WEBHOOK', 'SLACK'] }],
    },
    anomalies: [{
      timestamp: { type: Date, required: true },
      entityId: { type: Schema.Types.ObjectId },
      value: { type: String, required: true, match: /^-?\d+(\.\d{1,4})?$/ },
      expectedValue: { type: String, match: /^-?\d+(\.\d{1,4})?$/ },
      deviation: { type: String, required: true, match: /^-?\d+(\.\d{1,4})?$/ },
      score: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
      severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
      status: { type: String, enum: ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'], default: 'NEW' },
      acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      acknowledgedAt: { type: Date },
      resolutionNotes: { type: String, trim: true, maxlength: 2000 },
    }],
    lastDetectionAt: { type: Date },
    isActive: { type: Boolean, default: true },
    scheduleFrequency: { type: String, enum: ['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY'], default: 'DAILY' },
  },
  { timestamps: true, collection: 'anomaly_detections' },
);

anomalySchema.index({ organizationId: 1, code: 1 }, { unique: true });
anomalySchema.index({ organizationId: 1, status: 1, isActive: 1 });
anomalySchema.index({ organizationId: 1, 'anomalies.timestamp': -1 });

export type AnomalyDetection = InferSchemaType<typeof anomalySchema>;
export const AnomalyDetectionModel = model<AnomalyDetection>('AnomalyDetection', anomalySchema);