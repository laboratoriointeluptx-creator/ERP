import { createLead, listLeads } from '../repositories/lead.repository.js';
import type { CreateLeadInput, LeadQuery } from '../validators/lead.schemas.js';

export const registerLead = (organizationId: string, input: CreateLeadInput) => createLead(organizationId, input);
export const getLeads = (organizationId: string, query: LeadQuery) => listLeads(organizationId, query);
