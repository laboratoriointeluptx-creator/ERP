import { LeadModel, type Lead } from '../models/lead.model.js';
import type { CreateLeadInput, LeadQuery } from '../validators/lead.schemas.js';

export const createLead = (organizationId: string, input: CreateLeadInput): Promise<Lead> => LeadModel.create({ organizationId, ...input });

export const listLeads = async (organizationId: string, query: LeadQuery): Promise<{ items: Lead[]; total: number }> => {
  const filter = { organizationId, active: true, ...(query.stage ? { stage: query.stage } : {}) };
  const [items, total] = await Promise.all([
    LeadModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    LeadModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
