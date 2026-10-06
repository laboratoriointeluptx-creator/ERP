import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import type { ClientSession } from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createAccount, findAccount, findAccountByCode, listAccounts, updateAccount, deleteAccount, getChildren, getAccountTree } from '../repositories/account.repository.js';
import type { CreateAccountInput, AccountQuery, UpdateAccountInput } from '../validators/account.schemas.js';

export const registerAccount = async (organizationId: string, input: CreateAccountInput) => {
  if (input.parentId) {
    const parent = await findAccount(organizationId, input.parentId);
    if (!parent) throw new HttpError(404, 'PARENT_ACCOUNT_NOT_FOUND', 'Parent account not found');
    if (parent.level >= 10) throw new HttpError(400, 'MAX_LEVEL_REACHED', 'Maximum account hierarchy level reached');
    if (input.level !== parent.level + 1) throw new HttpError(400, 'INVALID_LEVEL', 'Account level must be parent level + 1');
    if (input.nature !== parent.nature) throw new HttpError(400, 'NATURE_MISMATCH', 'Child account must have same nature as parent');
  } else if (input.level !== 1) {
    throw new HttpError(400, 'ROOT_LEVEL_REQUIRED', 'Root accounts must have level 1');
  }

  try {
    return await createAccount(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'ACCOUNT_CODE_EXISTS', 'Account code already exists');
    }
    throw error;
  }
};

export const getAccounts = (organizationId: string, query: AccountQuery) => listAccounts(organizationId, query);

export const getAccountHierarchy = (organizationId: string) => getAccountTree(organizationId);

export const modifyAccount = async (organizationId: string, actorId: string, id: string, input: UpdateAccountInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findAccount(organizationId, id, session);
      if (!before) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');
      if (input.parentId && input.parentId !== String(before.parentId)) {
        const parent = await findAccount(organizationId, input.parentId, session);
        if (!parent) throw new HttpError(404, 'PARENT_ACCOUNT_NOT_FOUND', 'Parent account not found');
        if (String(parent._id) === id) throw new HttpError(400, 'SELF_REFERENCE', 'Account cannot be its own parent');
        const descendants = await getDescendants(organizationId, id, session);
        if (descendants.some((d) => String(d._id) === input.parentId)) throw new HttpError(400, 'CIRCULAR_REFERENCE', 'Cannot move account under its own descendant');
      }
      const updated = await updateAccount(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'account.updated' : input.isActive ? 'account.activated' : 'account.deactivated',
        module: 'chart-of-accounts',
        entity: 'Account',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Account update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeAccount = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findAccount(organizationId, id, session);
      if (!before) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');
      const children = await getChildren(organizationId, id, session);
      if (children.length > 0) throw new HttpError(409, 'HAS_CHILDREN', 'Cannot delete account with children');
      if (before.isSystem) throw new HttpError(409, 'SYSTEM_ACCOUNT', 'Cannot delete system account');
      const deleted = await deleteAccount(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'account.deleted',
        module: 'chart-of-accounts',
        entity: 'Account',
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

const getDescendants = async (organizationId: string, parentId: string, session?: ClientSession): Promise<Awaited<ReturnType<typeof getChildren>>> => {
  const descendants = [];
  const children = await getChildren(organizationId, parentId, session);
  for (const child of children) {
    descendants.push(child);
    descendants.push(...await getDescendants(organizationId, String(child._id), session));
  }
  return descendants;
};