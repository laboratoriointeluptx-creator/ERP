import { UserModel, type User } from '../models/user.model.js';

export const findUserForLogin = (organizationId: string, email: string): Promise<User | null> =>
  UserModel.findOne({ organizationId, email, active: true }).select('+passwordHash').exec() as Promise<User | null>;

export const findActiveUserById = (userId: string, organizationId: string): Promise<User | null> =>
  UserModel.findOne({ _id: userId, organizationId, active: true }).exec();
