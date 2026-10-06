import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createTicket, findTicket, findTicketByCode, listTickets, updateTicket, deleteTicket } from '../repositories/ticket.repository.js';
import { CustomerModel } from '../../customers/models/customer.model.js';
import { ContactModel } from '../../crm/models/contact.model.js';
import { UserModel } from '../../users/models/user.model.js';
import { SlaModel } from '../../sla/models/sla.model.js';
import type { CreateTicketInput, TicketQuery, UpdateTicketInput } from '../validators/ticket.schemas.js';

export const registerTicket = async (organizationId: string, input: CreateTicketInput) => {
  if (input.customerId) {
    const customer = await CustomerModel.findOne({ _id: input.customerId, organizationId }).exec();
    if (!customer) throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }
  if (input.contactId) {
    const contact = await ContactModel.findOne({ _id: input.contactId, organizationId }).exec();
    if (!contact) throw new HttpError(404, 'CONTACT_NOT_FOUND', 'Contact not found');
  }
  if (input.assigneeId) {
    const assignee = await UserModel.findOne({ _id: input.assigneeId, organizationId }).exec();
    if (!assignee) throw new HttpError(404, 'ASSIGNEE_NOT_FOUND', 'Assignee not found');
  }
  if (input.slaId) {
    const sla = await SlaModel.findOne({ _id: input.slaId, organizationId }).exec();
    if (!sla) throw new HttpError(404, 'SLA_NOT_FOUND', 'SLA not found');
  }

  try {
    return await createTicket(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'TICKET_CODE_EXISTS', 'Ticket code already exists');
    }
    throw error;
  }
};

export const getTickets = (organizationId: string, query: TicketQuery) => listTickets(organizationId, query);

export const modifyTicket = async (organizationId: string, actorId: string, id: string, input: UpdateTicketInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findTicket(organizationId, id, session);
      if (!before) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
      const updated = await updateTicket(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'ticket.updated' : 'ticket.status_changed',
        module: 'tickets',
        entity: 'Ticket',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Ticket update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeTicket = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findTicket(organizationId, id, session);
      if (!before) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
      const deleted = await deleteTicket(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'ticket.deleted',
        module: 'tickets',
        entity: 'Ticket',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: null,
      }, session);
      result = deleted;
    });
    return result;
  } finally {
    await session.endSession();
  }
};