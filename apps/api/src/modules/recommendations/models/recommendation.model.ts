import { Schema, model, type InferSchemaType } from 'mongoose';

const recommendationSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['PURCHASE', 'INVENTORY_OPTIMIZATION', 'PRICING', 'CROSS_SELL', 'UPSELL', 'CHURN_PREVENTION', 'CUSTOMER_SEGMENTATION', 'DEMAND_FORECASTING', 'SUPPLIER_SELECTION', 'CUSTOM'], required: true },
    algorithm: { type: String, enum: ['COLLABORATIVE_FILTERING', 'CONTENT_BASED', 'HYBRID', 'MATRIX_FACTORIZATION', 'DEEP_LEARNING', 'ASSOCIATION_RULES', 'CLUSTERING', 'RULE_BASED', 'CUSTOM'], required: true },
    status: { type: String, enum: ['DRAFT', 'TRAINING', 'TRAINED', 'DEPLOYED', 'ARCHIVED', 'FAILED'], default: 'DRAFT' },
    target: {
      entityType: { type: String, required: true, trim: true, maxlength: 50 },
      entityId: { type: Schema.Types.ObjectId },
      audience: { type: String, enum: ['ALL_CUSTOMERS', 'SEGMENT', 'INDIVIDUAL', 'PRODUCTS', 'SUPPLIERS'], required: true },
      segmentId: { type: Schema.Types.ObjectId },
      filters: { type: Schema.Types.Mixed },
    },
    training: {
      dataSource: { type: String, required: true, trim: true, maxlength: 100 },
      features: [{ type: String, trim: true, maxlength: 100 }],
      targetVariable: { type: String, trim: true, maxlength: 100 },
      trainStartDate: { type: Date },
      trainEndDate: { type: Date },
      validationSplit: { type: Number, default: 0.2, min: 0, max: 0.5 },
      metrics: {
        precision: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        recall: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        f1Score: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        ndcg: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        coverage: { type: String, match: /^\d+(\.\d{1,4})?$/ },
      },
      trainedAt: { type: Date },
      trainingDurationMs: { type: Number },
    },
    recommendations: [{
      targetId: { type: Schema.Types.ObjectId },
      targetType: { type: String, trim: true, maxlength: 50 },
      items: [{
        itemId: { type: Schema.Types.ObjectId },
        itemType: { type: String, trim: true, maxlength: 50 },
        score: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
        rank: { type: Number, required: true },
        reason: { type: String, trim: true, maxlength: 500 },
        metadata: { type: Schema.Types.Mixed },
      }],
      generatedAt: { type: Date, required: true },
      expiresAt: { type: Date },
      context: { type: Schema.Types.Mixed },
    }],
    deployment: {
      isActive: { type: Boolean, default: false },
      endpoint: { type: String, trim: true, maxlength: 500 },
      batchSize: { type: Number, default: 100 },
      refreshFrequency: { type: String, enum: ['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'], default: 'DAILY' },
      lastRefreshAt: { type: Date },
      nextRefreshAt: { type: Date },
    },
    feedback: [{
      targetId: { type: Schema.Types.ObjectId },
      itemId: { type: Schema.Types.ObjectId },
      action: { type: String, enum: ['CLICKED', 'PURCHASED', 'DISMISSED', 'RATED', 'SAVED'], required: true },
      rating: { type: Number, min: 1, max: 5 },
      timestamp: { type: Date, default: Date.now },
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
    }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'recommendations' },
);

recommendationSchema.index({ organizationId: 1, code: 1 }, { unique: true });
recommendationSchema.index({ organizationId: 1, type: 1, status: 1 });
recommendationSchema.index({ organizationId: 1, isActive: 1, 'deployment.nextRefreshAt': 1 });
recommendationSchema.index({ organizationId: 1, 'recommendations.generatedAt': -1 });

export type Recommendation = InferSchemaType<typeof recommendationSchema>;
export const RecommendationModel = model<Recommendation>('Recommendation', recommendationSchema);