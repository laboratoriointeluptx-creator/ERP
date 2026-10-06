import { HttpError } from '../../../shared/http.js';
import { findWorkflowExecution, findWorkflowExecutionByCode, listWorkflowExecutions, updateWorkflowExecutionStatus } from '../repositories/workflow-execution.repository.js';
import type { WorkflowExecutionQuery } from '../validators/workflow-execution.schemas.js';

export const getWorkflowExecutions = (organizationId: string, query: WorkflowExecutionQuery) => listWorkflowExecutions(organizationId, query);

export const getWorkflowExecutionById = (organizationId: string, id: string) => findWorkflowExecution(organizationId, id);

export const getWorkflowExecutionByCode = (organizationId: string, code: string) => findWorkflowExecutionByCode(organizationId, code);

export const updateExecutionStatus = async (organizationId: string, id: string, status: string) => {
  const updated = await updateWorkflowExecutionStatus(organizationId, id, status);
  if (!updated) throw new HttpError(404, 'WORKFLOW_EXECUTION_NOT_FOUND', 'Workflow execution not found');
  return updated;
};