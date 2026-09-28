import { Schema, model, type InferSchemaType } from 'mongoose';

const loginAttemptSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    attempts: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'login_attempts' },
);

loginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type LoginAttempt = InferSchemaType<typeof loginAttemptSchema>;
export const LoginAttemptModel = model<LoginAttempt>('LoginAttempt', loginAttemptSchema);
