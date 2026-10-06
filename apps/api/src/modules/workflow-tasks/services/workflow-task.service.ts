import { HttpError } from '../../../shared/http.js';
import { findWorkflowTask, listWorkflowTasks, updateWorkflowTaskStatus } from '../repositories/workflow-task.repository.js';
import type { WorkflowTaskQuery } from '../validators/workflow-task.schemas.js';

export const getWorkflowTasks = (organizationId: string, query: WorkflowTaskQuery) => listWorkflowTasks(organizationId, query);

export const getWorkflowTaskById = (organizationId: string, id: string) => findWorkflowTask(organizationId, id);

export const updateTaskStatus = async (organizationId: string, id: string, status: string) => {
  const updated = await updateWorkflowTaskStatus(organizationId, id, status);
  if (!updated) throw new HttpError(404, 'WORKFLOW_TASK_NOT_FOUND', 'Workflow task not found');
  return updated;
};