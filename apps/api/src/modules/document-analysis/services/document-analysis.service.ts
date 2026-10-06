import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createDocumentAnalysis, findDocumentAnalysis, findDocumentAnalysisByCode, listDocumentAnalyses, updateDocumentAnalysis, deleteDocumentAnalysis, updateResults, validateAnalysis } from '../repositories/document-analysis.repository.js';
import type { CreateDocumentAnalysisInput, DocumentAnalysisQuery, UpdateDocumentAnalysisInput, ValidateDocumentAnalysisInput } from '../validators/document-analysis.schemas.js';

export const registerDocumentAnalysis = async (organizationId: string, input: CreateDocumentAnalysisInput) => {
  try {
    return await createDocumentAnalysis(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'DOCUMENT_ANALYSIS_CODE_EXISTS', 'Document analysis code already exists');
    }
    throw error;
  }
};

export const getDocumentAnalyses = (organizationId: string, query: DocumentAnalysisQuery) => listDocumentAnalyses(organizationId, query);

export const modifyDocumentAnalysis = async (organizationId: string, actorId: string, id: string, input: UpdateDocumentAnalysisInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDocumentAnalysis(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DOCUMENT_ANALYSIS_NOT_FOUND', 'Document analysis not found');
      const updated = await updateDocumentAnalysis(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'DOCUMENT_ANALYSIS_NOT_FOUND', 'Document analysis not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'document-analysis.updated',
        module: 'document-analysis',
        entity: 'DocumentAnalysis',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Document analysis update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeDocumentAnalysis = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDocumentAnalysis(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DOCUMENT_ANALYSIS_NOT_FOUND', 'Document analysis not found');
      const deleted = await deleteDocumentAnalysis(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'DOCUMENT_ANALYSIS_NOT_FOUND', 'Document analysis not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'document-analysis.deleted',
        module: 'document-analysis',
        entity: 'DocumentAnalysis',
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

export const processDocument = async (organizationId: string, id: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDocumentAnalysis(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DOCUMENT_ANALYSIS_NOT_FOUND', 'Document analysis not found');
      const processing = await updateDocumentAnalysis(organizationId, id, { status: 'PROCESSING' }, session);
      if (!processing) throw new HttpError(404, 'DOCUMENT_ANALYSIS_NOT_FOUND', 'Document analysis not found');
      // Processing logic would go here
      const completed = await updateResults(organizationId, id, { extractedData: {}, tables: [], keyValuePairs: [], entities: [], summary: '', overallConfidence: 0 }, session);
      if (!completed) throw new HttpError(404, 'DOCUMENT_ANALYSIS_NOT_FOUND', 'Document analysis not found');
      await recordAuditEvent({
        organizationId,
        userId: 'system',
        action: 'document-analysis.processed',
        module: 'document-analysis',
        entity: 'DocumentAnalysis',
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

export const validateDocumentAnalysisById = async (organizationId: string, actorId: string, id: string, input: ValidateDocumentAnalysisInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findDocumentAnalysis(organizationId, id, session);
      if (!before) throw new HttpError(404, 'DOCUMENT_ANALYSIS_NOT_FOUND', 'Document analysis not found');
      const validated = await validateAnalysis(organizationId, id, input, session);
      if (!validated) throw new HttpError(404, 'DOCUMENT_ANALYSIS_NOT_FOUND', 'Document analysis not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'document-analysis.validated',
        module: 'document-analysis',
        entity: 'DocumentAnalysis',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: validated.toObject(),
      }, session);
      result = validated;
    });
    return result;
  } finally {
    await session.endSession();
  }
};