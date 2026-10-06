import { Schema, model, type InferSchemaType } from 'mongoose';

const ticketSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: ['INCIDENT', 'REQUEST', 'PROBLEM', 'CHANGE'], default: 'INCIDENT' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_THIRD_PARTY', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    groupId: { type: Schema.Types.ObjectId },
    slaId: { type: Schema.Types.ObjectId, ref: 'SLA' },
    source: { type: String, enum: ['EMAIL', 'PHONE', 'PORTAL', 'CHAT', 'WALK_IN', 'API'], default: 'PORTAL' },
    dueDate: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    firstResponseAt: { type: Date },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    relatedTicketIds: [{ type: Schema.Types.ObjectId, ref: 'Ticket' }],
    satisfactionRating: { type: Number, min: 1, max: 5 },
    satisfactionComment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, collection: 'tickets' },
);

ticketSchema.index({ organizationId: 1, code: 1 }, { unique: true });
ticketSchema.index({ organizationId: 1, status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ organizationId: 1, assigneeId: 1, status: 1 });
ticketSchema.index({ organizationId: 1, customerId: 1, status: 1 });
ticketSchema.index({ organizationId: 1, slaId: 1, dueDate: 1 });

export type Ticket = InferSchemaType<typeof ticketSchema>;
export const TicketModel = model<Ticket>('Ticket', ticketSchema);