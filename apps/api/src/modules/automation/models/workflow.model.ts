import { Schema, model, type InferSchemaType } from 'mongoose';

const workflowStepSchema = new Schema(
  {
    type: { type: String, required: true, enum: ['CONDITION', 'APPROVAL', 'ACTION', 'NOTIFICATION'] },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    configuration: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const workflowSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    trigger: { type: String, required: true, trim: true, maxlength: 120 },
    steps: { type: [workflowStepSchema], required: true },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'workflows' },
);

workflowSchema.index({ organizationId: 1, active: 1, trigger: 1 });

export type Workflow = InferSchemaType<typeof workflowSchema>;
export const WorkflowModel = model<Workflow>('Workflow', workflowSchema);
