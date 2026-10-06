import { TaskModel } from '../models/task.model.js';
import type { TaskQuery, CreateTaskInput, UpdateTaskInput } from '../validators/task.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createTask = (organizationId: string, input: CreateTaskInput, session?: ClientSession) =>
  TaskModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findTask = (organizationId: string, id: string, session?: ClientSession) =>
  TaskModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findTaskByCode = (organizationId: string, projectId: string, code: string, session?: ClientSession) =>
  TaskModel.findOne({ organizationId, projectId, code }).session(session ?? null).exec();

export const listTasks = async (organizationId: string, query: TaskQuery) => {
  const filter: FilterQuery<typeof TaskModel> = { organizationId };
  if (query.projectId) filter.projectId = query.projectId;
  if (query.status) filter.status = query.status;
  if (query.assigneeId) filter.assigneeId = query.assigneeId;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    TaskModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    TaskModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateTask = (organizationId: string, id: string, input: UpdateTaskInput, session?: ClientSession) =>
  TaskModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteTask = (organizationId: string, id: string, session?: ClientSession) =>
  TaskModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();




