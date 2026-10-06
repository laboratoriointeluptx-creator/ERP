import { RecommendationModel } from '../models/recommendation.model.js';
import type { RecommendationQuery, CreateRecommendationInput, UpdateRecommendationInput, RecommendationFeedbackInput } from '../validators/recommendation.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createRecommendation = (organizationId: string, input: CreateRecommendationInput, session?: ClientSession) =>
  RecommendationModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findRecommendation = (organizationId: string, id: string, session?: ClientSession) =>
  RecommendationModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findRecommendationByCode = (organizationId: string, code: string, session?: ClientSession) =>
  RecommendationModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listRecommendations = async (organizationId: string, query: RecommendationQuery) => {
  const filter: FilterQuery<typeof RecommendationModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.algorithm) filter.algorithm = query.algorithm;
  if (query.status) filter.status = query.status;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    RecommendationModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    RecommendationModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateRecommendation = (organizationId: string, id: string, input: UpdateRecommendationInput, session?: ClientSession) =>
  RecommendationModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteRecommendation = (organizationId: string, id: string, session?: ClientSession) =>
  RecommendationModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const addRecommendationBatch = (organizationId: string, id: string, recommendations: unknown, session?: ClientSession) =>
  RecommendationModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $push: { recommendations: { $each: recommendations } }, $set: { 'deployment.lastRefreshAt': new Date() } },
    { new: true, session: session ?? null },
  ).exec();

export const addFeedback = (organizationId: string, id: string, feedback: RecommendationFeedbackInput, session?: ClientSession) =>
  RecommendationModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $push: { feedback: { ...feedback, timestamp: new Date() } } },
    { new: true, session: session ?? null },
  ).exec();




