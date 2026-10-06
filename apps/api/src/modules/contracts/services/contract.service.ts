import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createContract, findContract, findContractByCode, listContracts, updateContract, deleteContract } from '../repositories/contract.repository.js';
import { DocumentModel } from '../../documents/models/document.model.js';
import { AttachmentModel } from '../../attachments/models/attachment.model.js';
import { UserModel } from '../../users/models/user.model.js';
import type { CreateContractInput, ContractQuery, UpdateContractInput } from '../validators/contract.schemas.js';

export const registerContract = async (organizationId: string, input: CreateContractInput) => {
  if (input.documentIds?.length) {
    const docs = await DocumentModel.find({ _id: { $in: input.documentIds }, organizationId }).exec();
    if (docs.length !== input.documentIds.length) throw new HttpError(404, 'DOCUMENTS_NOT_FOUND', 'Some documents not found');
  }
  if (input.approvedBy) {
    const approver = await UserModel.findOne({ _id: input.approvedBy, organizationId }).exec();
    if (!approver) throw new HttpError(404, 'APPROVER_NOT_FOUND', 'Approver not found');
  }

  try {
    return await createContract(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'CONTRACT_CODE_EXISTS', 'Contract code already exists');
    }
    throw error;
  }
};

export const getContracts = (organizationId: string, query: ContractQuery) => listContracts(organizationId, query);

export const modifyContract = async (organizationId: string, actorId: string, id: string, input: UpdateContractInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findContract(organizationId, id, session);
      if (!before) throw new HttpError(404, 'CONTRACT_NOT_FOUND', 'Contract not found');
      const updated = await updateContract(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'CONTRACT_NOT_FOUND', 'Contract not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'contract.updated' : 'contract.status_changed',
        module: 'contracts',
        entity: 'Contract',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Contract update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeContract = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findContract(organizationId, id, session);
      if (!before) throw new HttpError(404, 'CONTRACT_NOT_FOUND', 'Contract not found');
      const deleted = await deleteContract(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'CONTRACT_NOT_FOUND', 'Contract not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'contract.deleted',
        module: 'contracts',
        entity: 'Contract',
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