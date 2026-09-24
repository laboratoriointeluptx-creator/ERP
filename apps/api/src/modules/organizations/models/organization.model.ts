import { Schema, model, type InferSchemaType } from 'mongoose';

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    timezone: { type: String, required: true, default: 'UTC' },
    currency: { type: String, required: true, default: 'MXN', uppercase: true, minlength: 3, maxlength: 3 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'organizations' },
);

organizationSchema.index({ code: 1 }, { unique: true });
organizationSchema.index({ active: 1, createdAt: -1 });

export type Organization = InferSchemaType<typeof organizationSchema>;
export const OrganizationModel = model<Organization>('Organization', organizationSchema);
