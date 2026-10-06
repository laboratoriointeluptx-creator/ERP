import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createAnomalyDetection, findAnomalyDetection, findAnomalyDetectionByCode, listAnomalyDetections, updateAnomalyDetection, deleteAnomalyDetection, addAnomaly, acknowledgeAnomaly } from '../repositories/anomaly-detection.repository.js';
import type { CreateAnomalyDetectionInput, AnomalyDetectionQuery, UpdateAnomalyDetectionInput, AcknowledgeAnomalyInput } from '../validators/anomaly-detection.schemas.js';

export const registerAnomalyDetection = async (organizationId: string, input: CreateAnomalyDetectionInput) => {
  try {
    return await createAnomalyDetection(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'ANOMALY_DETECTION_CODE_EXISTS', 'Anomaly detection code already exists');
    }
    throw error;
  }
};

export const getAnomalyDetections = (organizationId: string, query: AnomalyDetectionQuery) => listAnomalyDetections(organizationId, query);

export const modifyAnomalyDetection = async (organizationId: string, actorId: string, id: string, input: UpdateAnomalyDetectionInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findAnomalyDetection(organizationId, id, session);
      if (!before) throw new HttpError(404, 'ANOMALY_DETECTION_NOT_FOUND', 'Anomaly detection not found');
      const updated = await updateAnomalyDetection(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'ANOMALY_DETECTION_NOT_FOUND', 'Anomaly detection not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.isActive === undefined ? 'anomaly-detection.updated' : input.isActive ? 'anomaly-detection.activated' : 'anomaly-detection.deactivated',
        module: 'anomaly-detection',
        entity: 'AnomalyDetection',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Anomaly detection update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeAnomalyDetection = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findAnomalyDetection(organizationId, id, session);
      if (!before) throw new HttpError(404, 'ANOMALY_DETECTION_NOT_FOUND', 'Anomaly detection not found');
      const deleted = await deleteAnomalyDetection(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'ANOMALY_DETECTION_NOT_FOUND', 'Anomaly detection not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'anomaly-detection.deleted',
        module: 'anomaly-detection',
        entity: 'AnomalyDetection',
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

export const runDetection = async (organizationId: string, id: string) => {
  const detection = await findAnomalyDetection(organizationId, id);
  if (!detection) throw new HttpError(404, 'ANOMALY_DETECTION_NOT_FOUND', 'Anomaly detection not found');
  if (detection.status !== 'TRAINED' && detection.status !== 'MONITORING') throw new HttpError(409, 'INVALID_STATUS', 'Detection must be trained or monitoring');
  // Detection logic would go here
  return { detectionId: id, anomaliesFound: 0, runAt: new Date() };
};

export const acknowledgeAnomalyById = async (organizationId: string, actorId: string, id: string, anomalyIndex: number, input: AcknowledgeAnomalyInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findAnomalyDetection(organizationId, id, session);
      if (!before) throw new HttpError(404, 'ANOMALY_DETECTION_NOT_FOUND', 'Anomaly detection not found');
      if (anomalyIndex >= before.anomalies.length) throw new HttpError(404, 'ANOMALY_NOT_FOUND', 'Anomaly not found');
      const updated = await acknowledgeAnomaly(organizationId, id, anomalyIndex, input, session);
      if (!updated) throw new HttpError(404, 'ANOMALY_DETECTION_NOT_FOUND', 'Anomaly detection not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'anomaly.acknowledged',
        module: 'anomaly-detection',
        entity: 'AnomalyDetection',
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