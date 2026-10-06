import { Schema, model, type InferSchemaType } from 'mongoose';

const workCenterSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    type: { type: String, enum: ['MACHINE', 'LABOR', 'MIXED'], default: 'MACHINE' },
    capacityPerDay: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    capacityUom: { type: String, enum: ['HOURS', 'UNITS'], default: 'HOURS' },
    efficiency: { type: String, default: '1', match: /^\d+(\.\d{1,4})?$/ },
    costPerHour: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    location: { type: String, trim: true, maxlength: 200 },
    isActive: { type: Boolean, default: true },
    calendarId: { type: Schema.Types.ObjectId },
    machineIds: [{ type: Schema.Types.ObjectId }],
    employeeIds: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true, collection: 'work_centers' },
);

workCenterSchema.index({ organizationId: 1, code: 1 }, { unique: true });
workCenterSchema.index({ organizationId: 1, isActive: 1 });

export type WorkCenter = InferSchemaType<typeof workCenterSchema>;
export const WorkCenterModel = model<WorkCenter>('WorkCenter', workCenterSchema);