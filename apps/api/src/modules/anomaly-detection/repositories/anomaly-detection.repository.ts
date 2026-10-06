import { AnomalyDetectionModel } from '../models/anomaly-detection.model.js';
import type { AnomalyDetectionQuery, CreateAnomalyDetectionInput, UpdateAnomalyDetectionInput, AcknowledgeAnomalyInput } from '../validators/anomaly-detection.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createAnomalyDetection = (organizationId: string, input: CreateAnomalyDetectionInput, session?: ClientSession) =>
  AnomalyDetectionModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findAnomalyDetection = (organizationId: string, id: string, session?: ClientSession) =>
  AnomalyDetectionModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findAnomalyDetectionByCode = (organizationId: string, code: string, session?: ClientSession) =>
  AnomalyDetectionModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listAnomalyDetections = async (organizationId: string, query: AnomalyDetectionQuery) => {
  const filter: FilterQuery<typeof AnomalyDetectionModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    AnomalyDetectionModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    AnomalyDetectionModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateAnomalyDetection = (organizationId: string, id: string, input: UpdateAnomalyDetectionInput, session?: ClientSession) =>
  AnomalyDetectionModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteAnomalyDetection = (organizationId: string, id: string, session?: ClientSession) =>
  AnomalyDetectionModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const addAnomaly = (organizationId: string, id: string, anomaly: unknown, session?: ClientSession) =>
  AnomalyDetectionModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $push: { anomalies: anomaly }, $set: { lastDetectionAt: new Date() } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const acknowledgeAnomaly = (organizationId: string, id: string, anomalyIndex: number, input: AcknowledgeAnomalyInput, session?: ClientSession) =>
  AnomalyDetectionModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $set: { [`anomalies.${anomalyIndex}.status`]: 'ACKNOWLEDGED', [`anomalies.${anomalyIndex}.acknowledgedBy`]: input.acknowledgedBy, [`anomalies.${anomalyIndex}.acknowledgedAt`]: new Date(), [`anomalies.${anomalyIndex}.resolutionNotes`]: input.resolutionNotes } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();




