import { Schema, model, type Types, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    roles: { type: [String], required: true, default: ['user'] },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'users' },
);

userSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export type User = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const UserModel = model<User>('User', userSchema);
