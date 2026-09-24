import { Schema, model, type InferSchemaType } from 'mongoose';

const contactSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 40 },
    position: { type: String, trim: true, maxlength: 120 },
    primary: { type: Boolean, required: true, default: false },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'customer_contacts' },
);

contactSchema.index({ organizationId: 1, customerId: 1, email: 1 });
contactSchema.index({ organizationId: 1, customerId: 1, primary: 1 });

export type Contact = InferSchemaType<typeof contactSchema>;
export const ContactModel = model<Contact>('Contact', contactSchema);
