import type { ClientSession } from 'mongoose';
import { UserModel, type User } from '../models/user.model.js';
import type { CreateUserInput, UserQuery } from '../validators/user.schemas.js';

export const findUserForLogin = (organizationId: string, email: string): Promise<User | null> =>
  UserModel.findOne({ organizationId, email, active: true }).select('+passwordHash').exec() as Promise<User | null>;

export const findActiveUserById = (userId: string, organizationId: string): Promise<User | null> =>
  UserModel.findOne({ _id: userId, organizationId, active: true }).exec();

export const listOrganizationUsers = async (organizationId: string, query: UserQuery) => {
  const search = query.search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    organizationId,
    ...(query.active === undefined ? {} : { active: query.active }),
    ...(search ? { $or: [
      { email: new RegExp(search, 'i') },
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
    ] } : {}),
  };
  const [items, total] = await Promise.all([
    UserModel.find(filter).sort({ lastName: 1, firstName: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    UserModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const createOrganizationUser = (
  organizationId: string,
  input: CreateUserInput,
  passwordHash: string,
  session: ClientSession,
): Promise<User> => UserModel.create([{
  organizationId,
  email: input.email,
  firstName: input.firstName,
  lastName: input.lastName,
  passwordHash,
  roles: ['user'],
  active: true,
}], { session }).then(([user]) => {
  if (!user) throw new Error('User creation returned no document');
  return user;
});

export const findOrganizationUserById = (organizationId: string, userId: string, session: ClientSession): Promise<User | null> =>
  UserModel.findOne({ _id: userId, organizationId }).session(session).exec();

export const updateOrganizationUserActiveStatus = async (
  organizationId: string,
  userId: string,
  expectedActive: boolean,
  active: boolean,
  session: ClientSession,
): Promise<boolean> => {
  const result = await UserModel.updateOne(
    { _id: userId, organizationId, active: expectedActive },
    { $set: { active } },
    { session },
  ).exec();
  return result.matchedCount === 1;
};
