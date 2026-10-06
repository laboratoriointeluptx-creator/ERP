import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createAgent, findAgent, findAgentByCode, listAgents, updateAgent, deleteAgent, updateAgentMetrics } from '../repositories/agent.repository.js';
import type { CreateAgentInput, AgentQuery, UpdateAgentInput } from '../validators/agent.schemas.js';

export const registerAgent = async (organizationId: string, input: CreateAgentInput) => {
  try {
    return await createAgent(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'AGENT_CODE_EXISTS', 'Agent code already exists');
    }
    throw error;
  }
};

export const getAgents = (organizationId: string, query: AgentQuery) => listAgents(organizationId, query);

export const modifyAgent = async (organizationId: string, actorId: string, id: string, input: UpdateAgentInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findAgent(organizationId, id, session);
      if (!before) throw new HttpError(404, 'AGENT_NOT_FOUND', 'Agent not found');
      const updated = await updateAgent(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'AGENT_NOT_FOUND', 'Agent not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'agent.updated' : input.isActive ? 'agent.activated' : 'agent.deactivated',
        module: 'agents',
        entity: 'Agent',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Agent update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeAgent = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findAgent(organizationId, id, session);
      if (!before) throw new HttpError(404, 'AGENT_NOT_FOUND', 'Agent not found');
      const deleted = await deleteAgent(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'AGENT_NOT_FOUND', 'Agent not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'agent.deleted',
        module: 'agents',
        entity: 'Agent',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: null,
      }, session);
      result = deleted;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const deployAgent = async (organizationId: string, actorId: string, id: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findAgent(organizationId, id, session);
      if (!before) throw new HttpError(404, 'AGENT_NOT_FOUND', 'Agent not found');
      const deployed = await updateAgent(organizationId, id, { status: 'DEPLOYED', deployedAt: new Date(), deployedBy: actorId }, session);
      if (!deployed) throw new HttpError(404, 'AGENT_NOT_FOUND', 'Agent not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'agent.deployed',
        module: 'agents',
        entity: 'Agent',
        entityId: id,
        before: before.toObject(),
        after: deployed.toObject(),
      }, session);
      result = deployed;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const executeAgent = async (organizationId: string, id: string, input: unknown) => {
  const agent = await findAgent(organizationId, id);
  if (!agent) throw new HttpError(404, 'AGENT_NOT_FOUND', 'Agent not found');
  if (agent.status !== 'DEPLOYED' && agent.status !== 'ACTIVE') throw new HttpError(409, 'INVALID_STATUS', 'Agent must be deployed or active');
  // Execution logic would go here
  await updateAgentMetrics(organizationId, id, { totalExecutions: 1 });
  return { agentId: id, result: 'Execution completed', executedAt: new Date() };
};