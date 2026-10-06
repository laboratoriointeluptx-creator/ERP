import { WorkflowExecutionModel } from '../models/workflow-execution.model.js';
import type { WorkflowExecutionQuery } from '../validators/workflow-execution.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const findWorkflowExecution = (organizationId: string, id: string, session?: ClientSession) =>
  WorkflowExecutionModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findWorkflowExecutionByCode = (organizationId: string, code: string, session?: ClientSession) =>
  WorkflowExecutionModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listWorkflowExecutions = async (organizationId: string, query: WorkflowExecutionQuery) => {
  const filter: FilterQuery<typeof WorkflowExecutionModel> = { organizationId };
  if (query.workflowId) filter.workflowId = query.workflowId;
  if (query.status) filter.status = query.status;
  if (query.triggerType) filter.triggerType = query.triggerType;
  if (query.dateFrom || query.dateTo) {
    filter.startedAt = {};
    if (query.dateFrom) filter.startedAt.$gte = query.dateFrom;
    if (query.dateTo) filter.startedAt.$lte = query.dateTo;
  }
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    WorkflowExecutionModel.find(filter).sort({ startedAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    WorkflowExecutionModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateWorkflowExecutionStatus = (organizationId: string, id: string, status: string, session?: ClientSession) =>
  WorkflowExecutionModel.findOneAndUpdate({ _id: id, organizationId }, { $set: { status } }, { new: true, session: session ?? null }).exec();

