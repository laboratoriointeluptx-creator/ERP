import { Schema, model, type InferSchemaType } from 'mongoose';

const activitySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE'] },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    dueAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: 'crm_activities' },
);

activitySchema.index({ organizationId: 1, assignedTo: 1, dueAt: 1 });
activitySchema.index({ organizationId: 1, customerId: 1, createdAt: -1 });

export type Activity = InferSchemaType<typeof activitySchema>;
export const ActivityModel = model<Activity>('Activity', activitySchema);
