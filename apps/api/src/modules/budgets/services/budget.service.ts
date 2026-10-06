import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createBudget, findBudget, listBudgets, updateBudget, deleteBudget, approveBudget, activateBudget, closeBudget, updateActualAmount } from '../repositories/budget.repository.js';
import type { CreateBudgetInput, BudgetQuery, UpdateBudgetInput, ApproveBudgetInput } from '../validators/budget.schemas.js';

export const registerBudget = async (organizationId: string, input: CreateBudgetInput) => {
  try {
    return await createBudget(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'BUDGET_CODE_EXISTS', 'Budget code already exists');
    }
    throw error;
  }
};

export const getBudgets = (organizationId: string, query: BudgetQuery) => listBudgets(organizationId, query);

export const modifyBudget = async (organizationId: string, actorId: string, id: string, input: UpdateBudgetInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBudget(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft budgets can be modified');
      const updated = await updateBudget(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'budget.updated',
        module: 'budgets',
        entity: 'Budget',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Budget update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const approveBudgetById = async (organizationId: string, actorId: string, id: string, input: ApproveBudgetInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBudget(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft budgets can be approved');
      const updated = await approveBudget(organizationId, id, input.approvedBy, session);
      if (!updated) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'budget.approved',
        module: 'budgets',
        entity: 'Budget',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const activateBudgetById = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBudget(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      if (before.status !== 'APPROVED') throw new HttpError(409, 'NOT_APPROVED', 'Only approved budgets can be activated');
      const updated = await activateBudget(organizationId, id, session);
      if (!updated) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'budget.activated',
        module: 'budgets',
        entity: 'Budget',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const closeBudgetById = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBudget(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      if (before.status !== 'ACTIVE') throw new HttpError(409, 'NOT_ACTIVE', 'Only active budgets can be closed');
      const updated = await closeBudget(organizationId, id, session);
      if (!updated) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'budget.closed',
        module: 'budgets',
        entity: 'Budget',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeBudget = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBudget(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      if (before.status !== 'DRAFT') throw new HttpError(409, 'NOT_DRAFT', 'Only draft budgets can be deleted');
      const deleted = await deleteBudget(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'budget.deleted',
        module: 'budgets',
        entity: 'Budget',
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

export const recordActual = async (organizationId: string, budgetId: string, accountId: string, period: string, amount: string) => {
  const updated = await updateActualAmount(organizationId, budgetId, accountId, period, amount);
  if (!updated) throw new HttpError(404, 'BUDGET_NOT_FOUND', 'Budget not found or line not found');
  return updated;
};