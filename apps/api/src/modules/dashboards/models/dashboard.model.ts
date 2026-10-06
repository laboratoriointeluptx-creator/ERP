import { Schema, model, type InferSchemaType } from 'mongoose';

const widgetSchema = new Schema(
  {
    reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 1, max: 12 },
    height: { type: Number, required: true, min: 1, max: 12 },
    parameters: { type: Schema.Types.Mixed },
    refreshInterval: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const dashboardSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1000 },
    isDefault: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    widgets: { type: [widgetSchema], default: [] },
    layout: { type: String, enum: ['GRID', 'FREEFORM'], default: 'GRID' },
    columns: { type: Number, default: 12, min: 1, max: 24 },
    rowHeight: { type: Number, default: 100, min: 50 },
    theme: { type: String, enum: ['LIGHT', 'DARK', 'AUTO'], default: 'AUTO' },
    tags: [{ type: String, trim: true, maxlength: 50 }],
  },
  { timestamps: true, collection: 'dashboards' },
);

dashboardSchema.index({ organizationId: 1, code: 1 }, { unique: true });
dashboardSchema.index({ organizationId: 1, ownerId: 1, isPublic: 1 });

export type Widget = InferSchemaType<typeof widgetSchema>;
export type Dashboard = InferSchemaType<typeof dashboardSchema>;
export const DashboardModel = model<Dashboard>('Dashboard', dashboardSchema);