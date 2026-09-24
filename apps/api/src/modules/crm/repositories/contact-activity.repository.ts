import { ActivityModel, type Activity } from '../models/activity.model.js';
import { ContactModel, type Contact } from '../models/contact.model.js';
import type { CreateActivityInput, CreateContactInput } from '../validators/contact-activity.schemas.js';

export const createContact = (organizationId: string, input: CreateContactInput): Promise<Contact> => ContactModel.create({ organizationId, ...input });

export const createActivity = (organizationId: string, assignedTo: string, input: CreateActivityInput): Promise<Activity> =>
  ActivityModel.create({ organizationId, assignedTo, ...input });

export const listContacts = (organizationId: string, customerId: string): Promise<Contact[]> =>
  ContactModel.find({ organizationId, customerId, active: true }).sort({ primary: -1, lastName: 1 }).exec();

export const listActivities = (organizationId: string, assignedTo: string): Promise<Activity[]> =>
  ActivityModel.find({ organizationId, assignedTo }).sort({ dueAt: 1, createdAt: -1 }).limit(100).exec();
