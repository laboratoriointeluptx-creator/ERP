import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createBankAccount, findBankAccount, findBankAccountByCode, listBankAccounts, updateBankAccount, deleteBankAccount, updateBalance, setReconciliationDate } from '../repositories/bank-account.repository.js';
import type { CreateBankAccountInput, BankAccountQuery, UpdateBankAccountInput, ReconciliationInput } from '../validators/bank-account.schemas.js';

export const registerBankAccount = async (organizationId: string, input: CreateBankAccountInput) => {
  try {
    return await createBankAccount(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'BANK_ACCOUNT_CODE_EXISTS', 'Bank account code already exists');
    }
    throw error;
  }
};

export const getBankAccounts = (organizationId: string, query: BankAccountQuery) => listBankAccounts(organizationId, query);

export const modifyBankAccount = async (organizationId: string, actorId: string, id: string, input: UpdateBankAccountInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBankAccount(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BANK_ACCOUNT_NOT_FOUND', 'Bank account not found');
      const updated = await updateBankAccount(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'BANK_ACCOUNT_NOT_FOUND', 'Bank account not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'bank-account.updated' : input.isActive ? 'bank-account.activated' : 'bank-account.deactivated',
        module: 'banking',
        entity: 'BankAccount',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Bank account update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeBankAccount = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBankAccount(organizationId, id, session);
      if (!before) throw new HttpError(404, 'BANK_ACCOUNT_NOT_FOUND', 'Bank account not found');
      const deleted = await deleteBankAccount(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'BANK_ACCOUNT_NOT_FOUND', 'Bank account not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'bank-account.deleted',
        module: 'banking',
        entity: 'BankAccount',
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

export const applyTransaction = async (organizationId: string, bankAccountId: string, amount: string, isDeposit: boolean, ip?: string) => {
  const updated = await updateBalance(organizationId, bankAccountId, amount, isDeposit);
  if (!updated) throw new HttpError(404, 'BANK_ACCOUNT_NOT_FOUND', 'Bank account not found');
  return updated;
};

export const reconcile = async (organizationId: string, actorId: string, input: ReconciliationInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findBankAccount(organizationId, input.bankAccountId, session);
      if (!before) throw new HttpError(404, 'BANK_ACCOUNT_NOT_FOUND', 'Bank account not found');
      const updated = await setReconciliationDate(organizationId, input.bankAccountId, input.statementDate, session);
      if (!updated) throw new HttpError(404, 'BANK_ACCOUNT_NOT_FOUND', 'Bank account not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'bank-account.reconciled',
        module: 'banking',
        entity: 'BankAccount',
        entityId: input.bankAccountId,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: { ...updated.toObject(), reconciliation: input },
      }, session);
      result = updated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};