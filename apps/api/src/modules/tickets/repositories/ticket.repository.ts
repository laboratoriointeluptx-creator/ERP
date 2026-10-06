import { TicketModel } from '../models/ticket.model.js';
import type { TicketQuery, CreateTicketInput, UpdateTicketInput } from '../validators/ticket.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createTicket = (organizationId: string, input: CreateTicketInput, session?: ClientSession) =>
  TicketModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findTicket = (organizationId: string, id: string, session?: ClientSession) =>
  TicketModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findTicketByCode = (organizationId: string, code: string, session?: ClientSession) =>
  TicketModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listTickets = async (organizationId: string, query: TicketQuery) => {
  const filter: FilterQuery<typeof TicketModel> = { organizationId };
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.assigneeId) filter.assigneeId = query.assigneeId;
  if (query.customerId) filter.customerId = query.customerId;
  if (query.slaId) filter.slaId = query.slaId;
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = query.dateFrom;
    if (query.dateTo) filter.createdAt.$lte = query.dateTo;
  }
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { title: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    TicketModel.find(filter).sort({ priority: -1, createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    TicketModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateTicket = (organizationId: string, id: string, input: UpdateTicketInput, session?: ClientSession) =>
  TicketModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteTicket = (organizationId: string, id: string, session?: ClientSession) =>
  TicketModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




