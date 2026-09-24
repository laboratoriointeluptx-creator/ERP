import mongoose from 'mongoose';
import { env } from '../config/env.js';

export type DatabaseStatus = 'not_configured' | 'connecting' | 'connected' | 'disconnected';

const hasUsableDatabaseUri = (): boolean => Boolean(env.MONGODB_URI && !env.MONGODB_URI.includes('<db_password>'));

export const databaseHealth = (): { status: DatabaseStatus; configured: boolean } => {
  if (!hasUsableDatabaseUri()) {
    return { status: 'not_configured', configured: false };
  }

  const statusByReadyState: Record<number, DatabaseStatus> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnected',
  };

  return {
    status: statusByReadyState[mongoose.connection.readyState] ?? 'disconnected',
    configured: true,
  };
};

export const connectToDatabase = async (): Promise<void> => {
  if (!hasUsableDatabaseUri()) {
    return;
  }

  const databaseUri = env.MONGODB_URI;
  if (!databaseUri) {
    return;
  }

  await mongoose.connect(databaseUri, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 5_000,
  });
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
