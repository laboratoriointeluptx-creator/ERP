import { AgentModel } from '../models/agent.model.js';
import type { AgentQuery, CreateAgentInput, UpdateAgentInput } from '../validators/agent.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createAgent = (organizationId: string, input: CreateAgentInput, session?: ClientSession) =>
  AgentModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findAgent = (organizationId: string, id: string, session?: ClientSession) =>
  AgentModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findAgentByCode = (organizationId: string, code: string, session?: ClientSession) =>
  AgentModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listAgents = async (organizationId: string, query: AgentQuery) => {
  const filter: FilterQuery<typeof AgentModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    AgentModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    AgentModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateAgent = (organizationId: string, id: string, input: UpdateAgentInput, session?: ClientSession) =>
  AgentModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteAgent = (organizationId: string, id: string, session?: ClientSession) =>
  AgentModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const updateAgentMetrics = (organizationId: string, id: string, metrics: Partial<{ totalExecutions: number; successfulExecutions: number; failedExecutions: number; avgExecutionTimeMs: number; avgTokensUsed: number; userSatisfaction: string }>, session?: ClientSession) =>
  AgentModel.findOneAndUpdate({ _id: id, organizationId }, { $inc: { totalExecutions: metrics.totalExecutions ?? 0, successfulExecutions: metrics.successfulExecutions ?? 0, failedExecutions: metrics.failedExecutions ?? 0 }, $set: { avgExecutionTimeMs: metrics.avgExecutionTimeMs, avgTokensUsed: metrics.avgTokensUsed, userSatisfaction: metrics.userSatisfaction, lastExecutedAt: new Date() } }, { new: true, session: session ?? null }).exec();


