import { Schema, model, type InferSchemaType } from 'mongoose';

const slaLevelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
    responseTimeMinutes: { type: Number, required: true, min: 0 },
    resolutionTimeMinutes: { type: Number, required: true, min: 0 },
    businessHoursOnly: { type: Boolean, default: true },
    escalationLevels: [{
      level: { type: Number, required: true },
      notifyAfterMinutes: { type: Number, required: true },
      assigneeRole: { type: String, trim: true, maxlength: 50 },
      assigneeIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    }],
  },
  { _id: false },
);

const slaSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    coverageHours: {
      monday: { start: { type: String, match: /^\d{2}:\d{2}$/ }, end: { type: String, match: /^\d{2}:\d{2}$/ }, isWorking: { type: Boolean, default: true } },
      tuesday: { start: { type: String, match: /^\d{2}:\d{2}$/ }, end: { type: String, match: /^\d{2}:\d{2}$/ }, isWorking: { type: Boolean, default: true } },
      wednesday: { start: { type: String, match: /^\d{2}:\d{2}$/ }, end: { type: String, match: /^\d{2}:\d{2}$/ }, isWorking: { type: Boolean, default: true } },
      thursday: { start: { type: String, match: /^\d{2}:\d{2}$/ }, end: { type: String, match: /^\d{2}:\d{2}$/ }, isWorking: { type: Boolean, default: true } },
      friday: { start: { type: String, match: /^\d{2}:\d{2}$/ }, end: { type: String, match: /^\d{2}:\d{2}$/ }, isWorking: { type: Boolean, default: true } },
      saturday: { start: { type: String, match: /^\d{2}:\d{2}$/ }, end: { type: String, match: /^\d{2}:\d{2}$/ }, isWorking: { type: Boolean, default: false } },
      sunday: { start: { type: String, match: /^\d{2}:\d{2}$/ }, end: { type: String, match: /^\d{2}:\d{2}$/ }, isWorking: { type: Boolean, default: false } },
    },
    holidays: [{ date: { type: Date }, name: { type: String, maxlength: 100 } }],
    levels: { type: [slaLevelSchema], required: true, validate: { validator: (v: unknown[]) => v.length > 0, message: 'At least one SLA level required' } },
    excludedCategories: [{ type: String, trim: true, maxlength: 50 }],
  },
  { timestamps: true, collection: 'slas' },
);

slaSchema.index({ organizationId: 1, code: 1 }, { unique: true });
slaSchema.index({ organizationId: 1, isActive: 1, isDefault: 1 });

export type SlaLevel = InferSchemaType<typeof slaLevelSchema>;
export type SLA = InferSchemaType<typeof slaSchema>;
export const SlaModel = model<SLA>('SLA', slaSchema);