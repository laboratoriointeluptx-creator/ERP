import { Schema, model, type InferSchemaType } from 'mongoose';

const salesOrderLineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    unitPrice: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
  },
  { _id: false },
);

const salesOrderSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    status: { type: String, required: true, enum: ['DRAFT', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'COMPLETED', 'CANCELLED'], default: 'DRAFT' },
    confirmedAt: { type: Date },
    lines: { type: [salesOrderLineSchema], required: true, validate: [(lines: unknown[]) => lines.length > 0, 'At least one line is required'] },
    currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3, default: 'MXN' },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true, collection: 'sales_orders' },
);

salesOrderSchema.index({ organizationId: 1, code: 1 }, { unique: true });
salesOrderSchema.index({ organizationId: 1, customerId: 1, status: 1, createdAt: -1 });

export type SalesOrder = InferSchemaType<typeof salesOrderSchema>;
export const SalesOrderModel = model<SalesOrder>('SalesOrder', salesOrderSchema);
