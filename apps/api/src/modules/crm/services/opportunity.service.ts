import { createOpportunity, listOpportunities } from '../repositories/opportunity.repository.js';
import type { CreateOpportunityInput, OpportunityQuery } from '../validators/opportunity.schemas.js';

export const registerOpportunity = (organizationId: string, input: CreateOpportunityInput) => createOpportunity(organizationId, input);
export const getOpportunities = (organizationId: string, query: OpportunityQuery) => listOpportunities(organizationId, query);
