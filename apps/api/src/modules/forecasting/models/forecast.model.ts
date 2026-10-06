import { Schema, model, type InferSchemaType } from 'mongoose';

const forecastSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['DEMAND', 'SALES', 'INVENTORY', 'CASHFLOW', 'PRODUCTION', 'CUSTOM'], required: true },
    model: { type: String, enum: ['ARIMA', 'PROPHET', 'LSTM', 'XGBOOST', 'LINEAR_REGRESSION', 'MOVING_AVERAGE', 'EXPONENTIAL_SMOOTHING', 'ENSEMBLE'], required: true },
    status: { type: String, enum: ['DRAFT', 'TRAINING', 'TRAINED', 'DEPLOYED', 'ARCHIVED', 'FAILED'], default: 'DRAFT' },
    dataSource: {
      entityType: { type: String, required: true, trim: true, maxlength: 50 },
      entityId: { type: Schema.Types.ObjectId },
      dateField: { type: String, required: true, trim: true, maxlength: 50 },
      valueField: { type: String, required: true, trim: true, maxlength: 50 },
      filters: { type: Schema.Types.Mixed },
      frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'], required: true },
    },
    parameters: {
      horizon: { type: Number, required: true, min: 1, max: 365 },
      seasonality: { type: String, enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'AUTO'], default: 'AUTO' },
      confidenceLevel: { type: Number, default: 0.95, min: 0.5, max: 0.999 },
      includeHolidays: { type: Boolean, default: true },
      countryCode: { type: String, length: 2, default: 'MX' },
      externalRegressors: [{ type: String, trim: true, maxlength: 100 }],
    },
    training: {
      trainStartDate: { type: Date },
      trainEndDate: { type: Date },
      validationSplit: { type: Number, default: 0.2, min: 0, max: 0.5 },
      metrics: {
        mae: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        mape: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        rmse: { type: String, match: /^\d+(\.\d{1,4})?$/ },
        r2: { type: String, match: /^\d+(\.\d{1,4})?$/ },
      },
      trainedAt: { type: Date },
      trainingDurationMs: { type: Number },
    },
    predictions: [{
      date: { type: Date, required: true },
      predictedValue: { type: String, required: true, match: /^-?\d+(\.\d{1,4})?$/ },
      lowerBound: { type: String, match: /^-?\d+(\.\d{1,4})?$/ },
      upperBound: { type: String, match: /^-?\d+(\.\d{1,4})?$/ },
      confidence: { type: Number },
    }],
    lastPredictedAt: { type: Date },
    nextPredictionAt: { type: Date },
    isActive: { type: Boolean, default: true },
    scheduledFrequency: { type: String, enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'], default: 'NONE' },
  },
  { timestamps: true, collection: 'forecasts' },
);

forecastSchema.index({ organizationId: 1, code: 1 }, { unique: true });
forecastSchema.index({ organizationId: 1, type: 1, status: 1 });
forecastSchema.index({ organizationId: 1, isActive: 1, nextPredictionAt: 1 });

export type Forecast = InferSchemaType<typeof forecastSchema>;
export const ForecastModel = model<Forecast>('Forecast', forecastSchema);