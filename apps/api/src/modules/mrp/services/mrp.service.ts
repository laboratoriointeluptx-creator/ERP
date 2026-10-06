import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createMrpRun, findMrpRun, findMrpRunByCode, listMrpRuns, updateMrpRun } from '../repositories/mrp.repository.js';
import type { CreateMrpRunInput, MrpRunQuery } from '../validators/mrp.schemas.js';

export const registerMrpRun = async (organizationId: string, input: CreateMrpRunInput) => {
  try {
    return await createMrpRun(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'MRP_RUN_CODE_EXISTS', 'MRP run code already exists');
    }
    throw error;
  }
};

export const getMrpRuns = (organizationId: string, query: MrpRunQuery) => listMrpRuns(organizationId, query);

export const runMrp = async (organizationId: string, actorId: string, id: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findMrpRun(organizationId, id, session);
      if (!before) throw new HttpError(404, 'MRP_RUN_NOT_FOUND', 'MRP run not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'INVALID_STATUS', 'Only draft MRP runs can be executed');

      const running = await updateMrpRun(organizationId, id, { status: 'RUNNING', startedAt: new Date() }, session);
      if (!running) throw new HttpError(404, 'MRP_RUN_NOT_FOUND', 'MRP run not found');

      // MRP calculation logic would go here
      // For now, mark as completed with placeholder results
      const completed = await updateMrpRun(organizationId, id, {
        status: 'COMPLETED',
        completedAt: new Date(),
        results: [],
        summary: { totalProducts: 0, actionsRequired: 0, plannedOrdersGenerated: 0, exceptions: 0 },
      }, session);
      if (!completed) throw new HttpError(404, 'MRP_RUN_NOT_FOUND', 'MRP run not found');

      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'mrp.executed',
        module: 'mrp',
        entity: 'MrpRun',
        entityId: id,
        before: before.toObject(),
        after: completed.toObject(),
      }, session);
      result = completed;
    });
    return result;
  } finally {
    await session.endSession();
  }
};