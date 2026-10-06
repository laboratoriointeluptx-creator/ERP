import { ProjectModel } from '../models/project.model.js';
import type { ProjectQuery, CreateProjectInput, UpdateProjectInput } from '../validators/project.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createProject = (organizationId: string, input: CreateProjectInput, session?: ClientSession) =>
  ProjectModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findProject = (organizationId: string, id: string, session?: ClientSession) =>
  ProjectModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findProjectByCode = (organizationId: string, code: string, session?: ClientSession) =>
  ProjectModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listProjects = async (organizationId: string, query: ProjectQuery) => {
  const filter: FilterQuery<typeof ProjectModel> = { organizationId };
  if (query.status) filter.status = query.status;
  if (query.customerId) filter.customerId = query.customerId;
  if (query.projectManagerId) filter.projectManagerId = query.projectManagerId;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    ProjectModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    ProjectModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateProject = (organizationId: string, id: string, input: UpdateProjectInput, session?: ClientSession) =>
  ProjectModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteProject = (organizationId: string, id: string, session?: ClientSession) =>
  ProjectModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




