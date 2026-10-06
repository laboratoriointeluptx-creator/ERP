import { Schema, model, type InferSchemaType } from 'mongoose';

const workflowExecutionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    status: { type: String, enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'WAITING_APPROVAL'], default: 'PENDING' },
    triggerType: { type: String, enum: ['MANUAL', 'SCHEDULED', 'EVENT', 'WEBHOOK', 'API'], required: true },
    triggerData: { type: Schema.Types.Mixed },
    inputParameters: { type: Schema.Types.Mixed },
    outputParameters: { type: Schema.Types.Mixed },
    currentStep: { type: Number, default: 0 },
    totalSteps: { type: Number, default: 0 },
    completedSteps: { type: Number, default: 0 },
    failedSteps: { type: Number, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String, maxlength: 2000 },
    retryCount: { type: Number, default: 0 },
    parentExecutionId: { type: Schema.Types.ObjectId, ref: 'WorkflowExecution' },
    executedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'workflow_executions' },
);

workflowExecutionSchema.index({ organizationId: 1, workflowId: 1, status: 1 });
workflowExecutionSchema.index({ organizationId: 1, code: 1 }, { unique: true });
workflowExecutionSchema.index({ organizationId: 1, startedAt: -1 });

export type WorkflowExecution = InferSchemaType<typeof workflowExecutionSchema>;
export const WorkflowExecutionModel = model<WorkflowExecution>('WorkflowExecution', workflowExecutionSchema);