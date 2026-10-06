import { Schema, model, type InferSchemaType } from 'mongoose';

const settingSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    key: { type: String, required: true, trim: true, maxlength: 120 },
    value: { type: Schema.Types.Mixed, required: true },
    scope: { type: String, enum: ['organization', 'branch', 'user'], default: 'organization' },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, trim: true, maxlength: 500 },
    isPublic: { type: Boolean, default: false },
    dataType: { type: String, enum: ['string', 'number', 'boolean', 'json', 'date'], default: 'string' },
  },
  { timestamps: true, collection: 'settings' },
);

settingSchema.index({ organizationId: 1, key: 1, scope: 1, branchId: 1, userId: 1 }, { unique: true });
settingSchema.index({ organizationId: 1, scope: 1 });

export type Setting = InferSchemaType<typeof settingSchema>;
export const SettingModel = model<Setting>('Setting', settingSchema);