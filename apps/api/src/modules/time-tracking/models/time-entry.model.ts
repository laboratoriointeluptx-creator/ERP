import { Schema, model, type InferSchemaType } from 'mongoose';

const timeEntrySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    date: { type: Date, required: true, default: Date.now },
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    durationMinutes: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true, minlength: 3, maxlength: 1000 },
    billable: { type: Boolean, default: true },
    rate: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    cost: { type: String, match: /^\d+(\.\d{1,4})?$/ },
    status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'BILLED'], default: 'DRAFT' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  },
  { timestamps: true, collection: 'time_entries' },
);

timeEntrySchema.index({ organizationId: 1, userId: 1, date: -1 });
timeEntrySchema.index({ organizationId: 1, projectId: 1, date: -1 });
timeEntrySchema.index({ organizationId: 1, taskId: 1 });
timeEntrySchema.index({ organizationId: 1, status: 1 });

export type TimeEntry = InferSchemaType<typeof timeEntrySchema>;
export const TimeEntryModel = model<TimeEntry>('TimeEntry', timeEntrySchema);