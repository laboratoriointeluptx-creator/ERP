import { Schema, model, type InferSchemaType } from 'mongoose';

const workflowTaskSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    executionId: { type: Schema.Types.ObjectId, ref: 'WorkflowExecution', required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    stepId: { type: String, required: true, trim: true, maxlength: 100 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, enum: ['ACTION', 'CONDITION', 'APPROVAL', 'NOTIFICATION', 'WAIT', 'SCRIPT', 'INTEGRATION'], required: true },
    status: { type: String, enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'WAITING', 'CANCELLED'], default: 'PENDING' },
    sequence: { type: Number, required: true, min: 1 },
    inputData: { type: Schema.Types.Mixed },
    outputData: { type: Schema.Types.Mixed },
    actionConfig: {
      actionType: { type: String, trim: true, maxlength: 50 },
      parameters: { type: Schema.Types.Mixed },
      integrationId: { type: Schema.Types.ObjectId, ref: 'Integration' },
      webhookUrl: { type: String, trim: true, maxlength: 500 },
      script: { type: String, maxlength: 10000 },
    },
    conditionConfig: {
      expression: { type: String, trim: true, maxlength: 1000 },
      trueBranch: { type: String, trim: true, maxlength: 100 },
      falseBranch: { type: String, trim: true, maxlength: 100 },
    },
    approvalConfig: {
      approvers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      requiredApprovals: { type: Number, default: 1 },
      timeoutMinutes: { type: Number, default: 1440 },
      escalationUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    notificationConfig: {
      templateId: { type: String, trim: true, maxlength: 100 },
      recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      channels: [{ type: String, enum: ['EMAIL', 'PUSH', 'SMS', 'IN_APP', 'WEBHOOK'] }],
    },
    retryConfig: {
      maxRetries: { type: Number, default: 3 },
      retryDelayMinutes: { type: Number, default: 5 },
      retryOn: [{ type: String, enum: ['TIMEOUT', 'ERROR', 'VALIDATION_FAILED', 'ANY'] }],
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String, maxlength: 2000 },
    retryCount: { type: Number, default: 0 },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'workflow_tasks' },
);

workflowTaskSchema.index({ organizationId: 1, executionId: 1, sequence: 1 });
workflowTaskSchema.index({ organizationId: 1, status: 1, assignedTo: 1 });
workflowTaskSchema.index({ organizationId: 1, executionId: 1, status: 1 });

export type WorkflowTask = InferSchemaType<typeof workflowTaskSchema>;
export const WorkflowTaskModel = model<WorkflowTask>('WorkflowTask', workflowTaskSchema);