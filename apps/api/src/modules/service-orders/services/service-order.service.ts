import { HttpError } from '../../../shared/http.js';
import mongoose from 'mongoose';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { createServiceOrder, findServiceOrder, findServiceOrderByCode, listServiceOrders, updateServiceOrder, deleteServiceOrder } from '../repositories/service-order.repository.js';
import { TicketModel } from '../../tickets/models/ticket.model.js';
import { CustomerModel } from '../../customers/models/customer.model.js';
import { ContactModel } from '../../crm/models/contact.model.js';
import { UserModel } from '../../users/models/user.model.js';
import { ProductModel } from '../../products/models/product.model.js';
import { TaxModel } from '../../taxes/models/tax.model.js';
import type { CreateServiceOrderInput, ServiceOrderQuery, UpdateServiceOrderInput, ServiceOrderLineInput } from '../validators/service-order.schemas.js';

export const registerServiceOrder = async (organizationId: string, input: CreateServiceOrderInput) => {
  if (input.ticketId) {
    const ticket = await TicketModel.findOne({ _id: input.ticketId, organizationId }).exec();
    if (!ticket) throw new HttpError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
  }
  const customer = await CustomerModel.findOne({ _id: input.customerId, organizationId }).exec();
  if (!customer) throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  if (input.contactId) {
    const contact = await ContactModel.findOne({ _id: input.contactId, organizationId }).exec();
    if (!contact) throw new HttpError(404, 'CONTACT_NOT_FOUND', 'Contact not found');
  }
  if (input.assignedTechnicianId) {
    const tech = await UserModel.findOne({ _id: input.assignedTechnicianId, organizationId }).exec();
    if (!tech) throw new HttpError(404, 'TECHNICIAN_NOT_FOUND', 'Technician not found');
  }
  for (const line of input.lines ?? []) {
    if (line.productId) {
      const product = await ProductModel.findOne({ _id: line.productId, organizationId }).exec();
      if (!product) throw new HttpError(404, 'PRODUCT_NOT_FOUND', `Product ${line.productId} not found`);
    }
    for (const taxId of line.taxIds ?? []) {
      const tax = await TaxModel.findOne({ _id: taxId, organizationId }).exec();
      if (!tax) throw new HttpError(404, 'TAX_NOT_FOUND', `Tax ${taxId} not found`);
    }
  }

  try {
    return await createServiceOrder(organizationId, input);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'SERVICE_ORDER_CODE_EXISTS', 'Service order code already exists');
    }
    throw error;
  }
};

export const getServiceOrders = (organizationId: string, query: ServiceOrderQuery) => listServiceOrders(organizationId, query);

export const modifyServiceOrder = async (organizationId: string, actorId: string, id: string, input: UpdateServiceOrderInput, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findServiceOrder(organizationId, id, session);
      if (!before) throw new HttpError(404, 'SERVICE_ORDER_NOT_FOUND', 'Service order not found');
      const updated = await updateServiceOrder(organizationId, id, input, session);
      if (!updated) throw new HttpError(404, 'SERVICE_ORDER_NOT_FOUND', 'Service order not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: input.status === undefined ? 'service-order.updated' : 'service-order.status_changed',
        module: 'service-orders',
        entity: 'ServiceOrder',
        entityId: id,
        ...(ip ? { ip } : {}),
        before: before.toObject(),
        after: updated.toObject(),
      }, session);
      result = updated;
    });
    if (!result) throw new Error('Service order update transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};

export const removeServiceOrder = async (organizationId: string, actorId: string, id: string, ip?: string) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const before = await findServiceOrder(organizationId, id, session);
      if (!before) throw new HttpError(404, 'SERVICE_ORDER_NOT_FOUND', 'Service order not found');
      const deleted = await deleteServiceOrder(organizationId, id, session);
      if (!deleted) throw new HttpError(404, 'SERVICE_ORDER_NOT_FOUND', 'Service order not found');
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'service-order.deleted',
        module: 'service-orders',
        entity: 'ServiceOrder',
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