import { HttpError } from '../../../shared/http.js';
import { WorkflowExecutionModel } from '../models/workflow-execution.model.js';
import { WorkflowModel } from '../models/workflow.model.js';
import type { ExecuteWorkflowInput } from '../validators/workflow.schemas.js';

export const executeWorkflow = async (organizationId: string, input: ExecuteWorkflowInput) => {
  const workflow = await WorkflowModel.findOne({ organizationId, trigger: input.trigger, active: true }).sort({ updatedAt: -1 }).exec();
  if (!workflow) {
    throw new HttpError(404, 'WORKFLOW_NOT_FOUND', 'No active workflow matches the trigger');
  }

  const requiresApproval = workflow.steps.some((step) => step.type === 'APPROVAL');
  return WorkflowExecutionModel.create({
    organizationId,
    workflowId: workflow._id,
    status: requiresApproval ? 'WAITING_APPROVAL' : 'RUNNING',
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    currentStep: 0,
    context: input.context,
  });
};
