import { Schema, model, type InferSchemaType } from 'mongoose';

const taskSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'], default: 'TODO' },
    priority: { type: Number, default: 50, min: 1, max: 100 },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date },
    dueDate: { type: Date },
    estimatedHours: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    actualHours: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    parentTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    dependsOn: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    tags: [{ type: String, trim: true, maxlength: 50 }],
  },
  { timestamps: true, collection: 'tasks' },
);

taskSchema.index({ organizationId: 1, projectId: 1, code: 1 }, { unique: true });
taskSchema.index({ organizationId: 1, projectId: 1, status: 1 });
taskSchema.index({ organizationId: 1, assigneeId: 1, status: 1 });
taskSchema.index({ organizationId: 1, dueDate: 1 });

export type Task = InferSchemaType<typeof taskSchema>;
export const TaskModel = model<Task>('Task', taskSchema);