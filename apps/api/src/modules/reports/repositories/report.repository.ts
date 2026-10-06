import { ReportModel } from '../models/report.model.js';
import type { ReportQuery, CreateReportInput, UpdateReportInput } from '../validators/report.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createReport = (organizationId: string, input: CreateReportInput, session?: ClientSession) =>
  ReportModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findReport = (organizationId: string, id: string, session?: ClientSession) =>
  ReportModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findReportByCode = (organizationId: string, code: string, session?: ClientSession) =>
  ReportModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listReports = async (organizationId: string, query: ReportQuery) => {
  const filter: FilterQuery<typeof ReportModel> = { organizationId };
  if (query.category) filter.category = query.category;
  if (query.type) filter.type = query.type;
  if (query.isPublic !== undefined) filter.isPublic = query.isPublic;
  if (query.isScheduled !== undefined) filter.isScheduled = query.isScheduled;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    ReportModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    ReportModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateReport = (organizationId: string, id: string, input: UpdateReportInput, session?: ClientSession) =>
  ReportModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteReport = (organizationId: string, id: string, session?: ClientSession) =>
  ReportModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




