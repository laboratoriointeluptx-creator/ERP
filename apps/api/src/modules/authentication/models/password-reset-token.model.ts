import { Schema, model, type InferSchemaType } from 'mongoose';

const passwordResetTokenSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true, select: false },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    invalidatedAt: { type: Date },
  },
  { timestamps: true, collection: 'password_reset_tokens' },
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetTokenSchema.index({ organizationId: 1, userId: 1, expiresAt: 1 });

export type PasswordResetToken = InferSchemaType<typeof passwordResetTokenSchema>;
export const PasswordResetTokenModel = model<PasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);
