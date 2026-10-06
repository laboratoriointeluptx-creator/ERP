import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createDocument, findDocument, findDocumentByCode, listDocuments, updateDocument, deleteDocument } from '../repositories/document.repository.js';
import type { CreateDocumentInput, DocumentQuery, UpdateDocumentInput } from '../validators/document.schemas.js';

export const registerDocument = async (organizationId: string, input: CreateDocumentInput) => {
  try {
    return await createDocument(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'DOCUMENT_CODE_EXISTS', 'Document code already exists');
    }
    throw error;
  }
};

export const getDocuments = (organizationId: string, query: DocumentQuery) => listDocuments(organizationId, query);

export const modifyDocument = async (organizationId: string, actorId: string, id: string, input: UpdateDocumentInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDocument(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
      const updated = await updateDocument(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'document.updated' : 'document.status_changed',
        module: 'documents',
        entity: 'Document',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Document update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeDocument = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDocument(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
      const deleted = await deleteDocument(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'document.deleted',
        module: 'documents',
        entity: 'Document',
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