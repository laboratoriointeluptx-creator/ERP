import { Schema, model, type InferSchemaType } from 'mongoose';

const workflowExecutionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    status: { type: String, required: true, enum: ['RUNNING', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'RUNNING' },
    subjectType: { type: String, required: true, trim: true, maxlength: 80 },
    subjectId: { type: String, required: true, trim: true, maxlength: 80 },
    currentStep: { type: Number, required: true, default: 0 },
    context: { type: Schema.Types.Mixed, required: true, default: {} },
    errorMessage: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, collection: 'workflow_executions' },
);

workflowExecutionSchema.index({ organizationId: 1, status: 1, updatedAt: -1 });

export type WorkflowExecution = InferSchemaType<typeof workflowExecutionSchema>;
export const WorkflowExecutionModel = model<WorkflowExecution>('WorkflowExecution', workflowExecutionSchema);
