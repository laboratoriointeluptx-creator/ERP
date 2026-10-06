import { WorkflowTaskModel } from '../models/workflow-task.model.js';
import type { WorkflowTaskQuery } from '../validators/workflow-task.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const findWorkflowTask = (organizationId: string, id: string, session?: ClientSession) =>
  WorkflowTaskModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const listWorkflowTasks = async (organizationId: string, query: WorkflowTaskQuery) => {
  const filter: FilterQuery<typeof WorkflowTaskModel> = { organizationId };
  if (query.executionId) filter.executionId = query.executionId;
  if (query.workflowId) filter.workflowId = query.workflowId;
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.dateFrom || query.dateTo) {
    filter.startedAt = {};
    if (query.dateFrom) filter.startedAt.$gte = query.dateFrom;
    if (query.dateTo) filter.startedAt.$lte = query.dateTo;
  }
  if (query.search) filter.$or = [{ name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    WorkflowTaskModel.find(filter).sort({ sequence: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    WorkflowTaskModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateWorkflowTaskStatus = (organizationId: string, id: string, status: string, session?: ClientSession) =>
  WorkflowTaskModel.findOneAndUpdate({ _id: id, organizationId }, { $set: { status } }, { new: true, session: session ?? null }).exec();

