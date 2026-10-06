import { Schema, model, type InferSchemaType } from 'mongoose';

const routeSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    carrierId: { type: Schema.Types.ObjectId, ref: 'Carrier', required: true },
    origin: { type: String, required: true, trim: true, maxlength: 200 },
    destination: { type: String, required: true, trim: true, maxlength: 200 },
    distance: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    estimatedDuration: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND'], default: 'ON_DEMAND' },
    schedule: { type: String, trim: true, maxlength: 500 },
    costPerKm: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    baseCost: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'routes' },
);

routeSchema.index({ organizationId: 1, code: 1 }, { unique: true });
routeSchema.index({ organizationId: 1, carrierId: 1, isActive: 1 });

export type Route = InferSchemaType<typeof routeSchema>;
export const RouteModel = model<Route>('Route', routeSchema);