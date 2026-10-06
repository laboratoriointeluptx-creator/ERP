import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createRecommendation, findRecommendation, findRecommendationByCode, listRecommendations, updateRecommendation, deleteRecommendation, addRecommendationBatch, addFeedback } from '../repositories/recommendation.repository.js';
import type { CreateRecommendationInput, RecommendationQuery, UpdateRecommendationInput, RecommendationFeedbackInput } from '../validators/recommendation.schemas.js';

export const registerRecommendation = async (organizationId: string, input: CreateRecommendationInput) => {
  try {
    return await createRecommendation(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'RECOMMENDATION_CODE_EXISTS', 'Recommendation code already exists');
    }
    throw error;
  }
};

export const getRecommendations = (organizationId: string, query: RecommendationQuery) => listRecommendations(organizationId, query);

export const modifyRecommendation = async (organizationId: string, actorId: string, id: string, input: UpdateRecommendationInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findRecommendation(organizationId, id, session);
      if (!before) throw new HttpError(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
      const updated = await updateRecommendation(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'recommendation.updated' : input.isActive ? 'recommendation.activated' : 'recommendation.deactivated',
        module: 'recommendations',
        entity: 'Recommendation',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Recommendation update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeRecommendation = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findRecommendation(organizationId, id, session);
      if (!before) throw new HttpError(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
      const deleted = await deleteRecommendation(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'recommendation.deleted',
        module: 'recommendations',
        entity: 'Recommendation',
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

export const trainRecommendation = async (organizationId: string, id: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findRecommendation(organizationId, id, session);
      if (!before) throw new HttpError(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
      const training = await updateRecommendation(organizationId, id, { status: 'TRAINING' }, session);
      if (!training) throw new HttpError(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
      // Training logic would go here
      const trained = await updateRecommendation(organizationId, id, {
        status: 'TRAINED',
        training: { ...before.training, trainedAt: new Date(), metrics: { precision: '0', recall: '0', f1Score: '0', ndcg: '0', coverage: '0' } },
      }, session);
      if (!trained) throw new HttpError(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
      await recordAuditEvent({
        organizationId,
        userId: 'system',
        action: 'recommendation.trained',
        module: 'recommendations',
        entity: 'Recommendation',
        entityId: id,
        before: before.toObject(),
        after: trained.toObject(),
      }, session);
      result = trained;
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const generateRecommendations = async (organizationId: string, id: string) => {
  const recommendation = await findRecommendation(organizationId, id);
  if (!recommendation) throw new HttpError(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
  if (recommendation.status !== 'TRAINED' && recommendation.status !== 'DEPLOYED') throw new HttpError(409, 'INVALID_STATUS', 'Recommendation must be trained or deployed');
  // Generation logic would go here
  return { recommendationId: id, generatedAt: new Date() };
};

export const submitFeedback = async (organizationId: string, id: string, input: RecommendationFeedbackInput) => {
  const updated = await addFeedback(organizationId, id, input);
  if (!updated) throw new HttpError(404, 'RECOMMENDATION_NOT_FOUND', 'Recommendation not found');
  return updated;
};