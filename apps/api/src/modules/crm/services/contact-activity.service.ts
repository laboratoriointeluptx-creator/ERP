import { createActivity, createContact, listActivities, listContacts } from '../repositories/contact-activity.repository.js';
import type { CreateActivityInput, CreateContactInput } from '../validators/contact-activity.schemas.js';

export const registerContact = (organizationId: string, input: CreateContactInput) => createContact(organizationId, input);
export const registerActivity = (organizationId: string, assignedTo: string, input: CreateActivityInput) => createActivity(organizationId, assignedTo, input);
export const getContacts = (organizationId: string, customerId: string) => listContacts(organizationId, customerId);
export const getActivities = (organizationId: string, assignedTo: string) => listActivities(organizationId, assignedTo);
