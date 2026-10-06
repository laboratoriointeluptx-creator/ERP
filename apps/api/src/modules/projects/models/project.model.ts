import { Schema, model, type InferSchemaType } from 'mongoose';

const projectSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000 },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    status: { type: String, enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'], default: 'PLANNING' },
    priority: { type: Number, default: 50, min: 1, max: 100 },
    startDate: { type: Date },
    endDate: { type: Date },
    actualStartDate: { type: Date },
    actualEndDate: { type: Date },
    budget: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    actualCost: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    projectManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: String, trim: true, maxlength: 50 }],
  },
  { timestamps: true, collection: 'projects' },
);

projectSchema.index({ organizationId: 1, code: 1 }, { unique: true });
projectSchema.index({ organizationId: 1, status: 1, startDate: 1 });
projectSchema.index({ organizationId: 1, customerId: 1 });
projectSchema.index({ organizationId: 1, projectManagerId: 1 });

export type Project = InferSchemaType<typeof projectSchema>;
export const ProjectModel = model<Project>('Project', projectSchema);