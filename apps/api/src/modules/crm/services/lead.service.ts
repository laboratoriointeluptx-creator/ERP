import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { CustomerModel } from '../../customers/models/customer.model.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { LeadModel } from '../models/lead.model.js';
import { createLead, listLeads } from '../repositories/lead.repository.js';
import type { CreateLeadInput, LeadQuery } from '../validators/lead.schemas.js';

export const registerLead = async (organizationId: string, input: CreateLeadInput) => {
  if (input.customerId && !await CustomerModel.exists({ _id: input.customerId, organizationId, active: true }).exec()) {
    throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }
  return createLead(organizationId, input);
};
export const getLeads = (organizationId: string, query: LeadQuery) => listLeads(organizationId, query);

export const transitionLead = async (organizationId: string, userId: string, leadId: string, nextStage: string, ip?: string) => {
  const allowed: Record<string, readonly string[]> = { NEW: ['CONTACTED', 'LOST'], CONTACTED: ['QUALIFIED', 'LOST'], QUALIFIED: ['LOST'] };
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const lead = await LeadModel.findOne({ _id: leadId, organizationId, active: true }).session(session).exec();
      if (!lead) throw new HttpError(404, 'LEAD_NOT_FOUND', 'Lead not found');
      if (!allowed[lead.stage]?.includes(nextStage)) throw new HttpError(409, 'INVALID_LEAD_TRANSITION', `Cannot move lead from ${lead.stage} to ${nextStage}`);
      const previousStage = lead.stage;
      lead.stage = nextStage as typeof lead.stage;
      await lead.save({ session });
      await recordAuditEvent({ organizationId, userId, action: 'crm.lead.stage-changed', module: 'crm', entity: 'Lead', entityId: String(lead._id), ...(ip ? { ip } : {}), before: { stage: previousStage }, after: { stage: lead.stage } }, session);
      result = lead;
    });
    return result;
  } finally { await session.endSession(); }
};

export const convertLead = async (organizationId: string, userId: string, leadId: string, customerId: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const lead = await LeadModel.findOne({ _id: leadId, organizationId, active: true }).session(session).exec();
      if (!lead) throw new HttpError(404, 'LEAD_NOT_FOUND', 'Lead not found');
      if (lead.stage !== 'QUALIFIED') throw new HttpError(409, 'LEAD_NOT_CONVERTIBLE', 'Only qualified leads can be converted');
      const customer = await CustomerModel.findOne({ _id: customerId, organizationId, active: true }).session(session).exec();
      if (!customer) throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
      lead.customerId = customer._id;
      lead.stage = 'CONVERTED';
      await lead.save({ session });
      await recordAuditEvent({ organizationId, userId, action: 'crm.lead.converted', module: 'crm', entity: 'Lead', entityId: String(lead._id), ...(ip ? { ip } : {}), after: { stage: lead.stage, customerId: String(customer._id) } }, session);
      result = lead;
    });
    return result;
  } finally { await session.endSession(); }
};
