import { OpportunityModel, type Opportunity } from '../models/opportunity.model.js';
import type { CreateOpportunityInput, OpportunityQuery } from '../validators/opportunity.schemas.js';

export const createOpportunity = (organizationId: string, input: CreateOpportunityInput): Promise<Opportunity> => OpportunityModel.create({ organizationId, ...input });

export const listOpportunities = async (organizationId: string, query: OpportunityQuery): Promise<{ items: Opportunity[]; total: number }> => {
  const filter = { organizationId, active: true, ...(query.stage ? { stage: query.stage } : {}) };
  const [items, total] = await Promise.all([
    OpportunityModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    OpportunityModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};
