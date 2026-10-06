import { Schema, model, type InferSchemaType } from 'mongoose';

const serviceOrderLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    unitPrice: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    discount: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    taxIds: [{ type: Schema.Types.ObjectId, ref: 'Tax' }],
  },
  { _id: false },
);

const serviceOrderSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    status: { type: String, enum: ['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'], default: 'DRAFT' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    type: { type: String, enum: ['INSTALLATION', 'MAINTENANCE', 'REPAIR', 'INSPECTION', 'CONSULTING'], required: true },
    scheduledDate: { type: Date },
    scheduledEndDate: { type: Date },
    actualStartDate: { type: Date },
    actualEndDate: { type: Date },
    assignedTechnicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    lines: { type: [serviceOrderLineSchema], default: [] },
    totalAmount: { type: String, default: '0', match: /^\d+(\.\d{1,4})?$/ },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    serviceAddress: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 2000 },
    warrantyUntil: { type: Date },
    attachments: [{ type: String }],
  },
  { timestamps: true, collection: 'service_orders' },
);

serviceOrderSchema.index({ organizationId: 1, code: 1 }, { unique: true });
serviceOrderSchema.index({ organizationId: 1, status: 1, scheduledDate: 1 });
serviceOrderSchema.index({ organizationId: 1, customerId: 1, status: 1 });
serviceOrderSchema.index({ organizationId: 1, assignedTechnicianId: 1, status: 1 });
serviceOrderSchema.index({ organizationId: 1, ticketId: 1 });

export type ServiceOrderLine = InferSchemaType<typeof serviceOrderLineSchema>;
export type ServiceOrder = InferSchemaType<typeof serviceOrderSchema>;
export const ServiceOrderModel = model<ServiceOrder>('ServiceOrder', serviceOrderSchema);