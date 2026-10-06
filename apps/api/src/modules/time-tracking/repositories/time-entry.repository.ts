import { TimeEntryModel } from '../models/time-entry.model.js';
import type { TimeEntryQuery, CreateTimeEntryInput, UpdateTimeEntryInput } from '../validators/time-entry.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createTimeEntry = (organizationId: string, input: CreateTimeEntryInput, session?: ClientSession) =>
  TimeEntryModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findTimeEntry = (organizationId: string, id: string, session?: ClientSession) =>
  TimeEntryModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const listTimeEntries = async (organizationId: string, query: TimeEntryQuery) => {
  const filter: FilterQuery<typeof TimeEntryModel> = { organizationId };
  if (query.userId) filter.userId = query.userId;
  if (query.projectId) filter.projectId = query.projectId;
  if (query.taskId) filter.taskId = query.taskId;
  if (query.status) filter.status = query.status;
  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = query.dateFrom;
    if (query.dateTo) filter.date.$lte = query.dateTo;
  }
  if (query.billable !== undefined) filter.billable = query.billable;
  if (query.search) filter.$or = [{ description: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    TimeEntryModel.find(filter).sort({ date: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    TimeEntryModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateTimeEntry = (organizationId: string, id: string, input: UpdateTimeEntryInput, session?: ClientSession) =>
  TimeEntryModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const approveTimeEntry = (organizationId: string, id: string, approvedBy: string, session?: ClientSession) =>
  TimeEntryModel.findOneAndUpdate(
    { _id: id, organizationId, status: 'SUBMITTED' },
    { $set: { status: 'APPROVED', approvedBy, approvedAt: new Date() } },
    { new: true, runValidators: true, session: session ?? null },
  ).exec();

export const deleteTimeEntry = (organizationId: string, id: string, session?: ClientSession) =>
  TimeEntryModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




