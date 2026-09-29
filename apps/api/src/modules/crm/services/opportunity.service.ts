import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { CustomerModel } from '../../customers/models/customer.model.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { LeadModel } from '../models/lead.model.js';
import { OpportunityModel } from '../models/opportunity.model.js';
import { createOpportunity, listOpportunities } from '../repositories/opportunity.repository.js';
import type { CreateOpportunityInput, OpportunityQuery } from '../validators/opportunity.schemas.js';

export const registerOpportunity = async (organizationId: string, input: CreateOpportunityInput) => {
  if (input.customerId && !await CustomerModel.exists({ _id: input.customerId, organizationId, active: true }).exec()) {
    throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }
  if (input.leadId && !await LeadModel.exists({ _id: input.leadId, organizationId, active: true, stage: { $ne: 'CONVERTED' } }).exec()) {
    throw new HttpError(404, 'LEAD_NOT_FOUND', 'Open lead not found');
  }
  return createOpportunity(organizationId, input);
};
export const getOpportunities = (organizationId: string, query: OpportunityQuery) => listOpportunities(organizationId, query);

export const transitionOpportunity = async (organizationId: string, userId: string, opportunityId: string, nextStage: string, ip?: string) => {
  const allowed: Record<string, readonly string[]> = {
    PROSPECTING: ['PROPOSAL', 'LOST'],
    PROPOSAL: ['NEGOTIATION', 'LOST'],
    NEGOTIATION: ['WON', 'LOST'],
  };
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const opportunity = await OpportunityModel.findOne({ _id: opportunityId, organizationId, active: true }).session(session).exec();
      if (!opportunity) throw new HttpError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found');
      if (!allowed[opportunity.stage]?.includes(nextStage)) throw new HttpError(409, 'INVALID_OPPORTUNITY_TRANSITION', `Cannot move opportunity from ${opportunity.stage} to ${nextStage}`);
      const previousStage = opportunity.stage;
      opportunity.stage = nextStage as typeof opportunity.stage;
      await opportunity.save({ session });
      await recordAuditEvent({ organizationId, userId, action: 'crm.opportunity.stage-changed', module: 'crm', entity: 'Opportunity', entityId: String(opportunity._id), ...(ip ? { ip } : {}), before: { stage: previousStage }, after: { stage: opportunity.stage } }, session);
      result = opportunity;
    });
    return result;
  } finally { await session.endSession(); }
};
