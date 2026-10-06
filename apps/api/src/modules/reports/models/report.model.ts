import { Schema, model, type InferSchemaType } from 'mongoose';

const reportSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, enum: ['FINANCIAL', 'SALES', 'PURCHASES', 'INVENTORY', 'PRODUCTION', 'HR', 'PROJECTS', 'SERVICES', 'CUSTOM', 'EXECUTIVE'], default: 'CUSTOM' },
    type: { type: String, enum: ['TABLE', 'CHART', 'PIVOT', 'DASHBOARD', 'EXPORT'], default: 'TABLE' },
    dataSource: { type: String, required: true, trim: true, maxlength: 100 },
    query: { type: Schema.Types.Mixed, required: true },
    parameters: [{
      name: { type: String, required: true, trim: true, maxlength: 50 },
      type: { type: String, enum: ['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT'], required: true },
      label: { type: String, required: true, trim: true, maxlength: 100 },
      required: { type: Boolean, default: false },
      defaultValue: { type: Schema.Types.Mixed },
      options: [{ value: { type: Schema.Types.Mixed }, label: { type: String } }],
    }],
    columns: [{
      field: { type: String, required: true, trim: true, maxlength: 50 },
      label: { type: String, required: true, trim: true, maxlength: 100 },
      type: { type: String, enum: ['STRING', 'NUMBER', 'CURRENCY', 'PERCENTAGE', 'DATE', 'DATETIME', 'BOOLEAN'], default: 'STRING' },
      format: { type: String, trim: true, maxlength: 50 },
      width: { type: Number },
      sortable: { type: Boolean, default: true },
      filterable: { type: Boolean, default: true },
      aggregation: { type: String, enum: ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'NONE'], default: 'NONE' },
    }],
    filters: [{
      field: { type: String, required: true, trim: true, maxlength: 50 },
      operator: { type: String, enum: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'LIKE', 'BETWEEN'], required: true },
      value: { type: Schema.Types.Mixed },
    }],
    sort: [{
      field: { type: String, required: true, trim: true, maxlength: 50 },
      direction: { type: String, enum: ['ASC', 'DESC'], required: true },
    }],
    groupBy: [{ type: String, trim: true, maxlength: 50 }],
    chartConfig: {
      type: { type: String, enum: ['BAR', 'LINE', 'PIE', 'AREA', 'SCATTER', 'HEATMAP'] },
      xAxis: { type: String, trim: true, maxlength: 50 },
      yAxis: { type: String, trim: true, maxlength: 50 },
      series: [{ field: { type: String, trim: true, maxlength: 50 }, label: { type: String, trim: true, maxlength: 100 }, color: { type: String, maxlength: 7 } }],
    },
    isPublic: { type: Boolean, default: false },
    isScheduled: { type: Boolean, default: false },
    scheduleCron: { type: String, trim: true, maxlength: 100 },
    scheduleRecipients: [{ type: String, trim: true, maxlength: 160 }],
    scheduleFormat: { type: String, enum: ['PDF', 'EXCEL', 'CSV', 'HTML'], default: 'PDF' },
    lastRunAt: { type: Date },
    lastRunStatus: { type: String, enum: ['SUCCESS', 'FAILED', 'PARTIAL'] },
    lastRunError: { type: String, maxlength: 2000 },
    runCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'reports' },
);

reportSchema.index({ organizationId: 1, code: 1 }, { unique: true });
reportSchema.index({ organizationId: 1, category: 1, isPublic: 1 });
reportSchema.index({ organizationId: 1, isScheduled: 1 });

export type Report = InferSchemaType<typeof reportSchema>;
export const ReportModel = model<Report>('Report', reportSchema);