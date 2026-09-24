import { Schema, model, type InferSchemaType } from 'mongoose';

const opportunitySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    stage: { type: String, required: true, enum: ['PROSPECTING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'], default: 'PROSPECTING' },
    estimatedValue: { type: String, required: true, match: /^\d+(\.\d{1,4})?$/ },
    expectedCloseDate: { type: Date },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'opportunities' },
);

opportunitySchema.index({ organizationId: 1, stage: 1, createdAt: -1 });

export type Opportunity = InferSchemaType<typeof opportunitySchema>;
export const OpportunityModel = model<Opportunity>('Opportunity', opportunitySchema);
