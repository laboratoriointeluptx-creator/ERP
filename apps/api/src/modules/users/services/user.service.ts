import mongoose from 'mongoose';
import { HttpError } from '../../../shared/http.js';
import { recordAuditEvent } from '../../audit/services/audit.service.js';
import { SessionModel } from '../../authentication/models/session.model.js';
import { hashPassword } from '../../authentication/services/password.service.js';
import {
  createOrganizationUser,
  findOrganizationUserById,
  listOrganizationUsers,
  updateOrganizationUserActiveStatus,
} from '../repositories/user.repository.js';
import type { CreateUserInput, UserQuery } from '../validators/user.schemas.js';

const publicUser = (user: {
  _id: unknown;
  organizationId: unknown;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: String(user._id),
  organizationId: String(user.organizationId),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  roles: user.roles,
  active: user.active,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getOrganizationUsers = async (organizationId: string, query: UserQuery) => {
  const result = await listOrganizationUsers(organizationId, query);
  return { ...result, items: result.items.map(publicUser) };
};

export const registerOrganizationUser = async (
  organizationId: string,
  actorId: string,
  input: CreateUserInput,
  ip?: string,
) => {
  const passwordHash = await hashPassword(input.initialPassword);
  const session = await mongoose.startSession();
  try {
    let result: ReturnType<typeof publicUser> | undefined;
    await session.withTransaction(async () => {
      const user = await createOrganizationUser(organizationId, input, passwordHash, session);
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: 'user.created',
        module: 'users',
        entity: 'User',
        entityId: String(user._id),
        ...(ip ? { ip } : {}),
        after: { email: user.email, roles: user.roles, active: user.active },
      }, session);
      result = publicUser(user);
    });
    if (!result) throw new Error('User creation transaction returned no result');
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'USER_EMAIL_EXISTS', 'A user with this email already exists in the organization');
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

export const setOrganizationUserStatus = async (
  organizationId: string,
  actorId: string,
  userId: string,
  active: boolean,
  ip?: string,
) => {
  if (actorId === userId && !active) {
    throw new HttpError(409, 'SELF_DEACTIVATION_NOT_ALLOWED', 'You cannot deactivate your own account');
  }

  const session = await mongoose.startSession();
  try {
    let result: ReturnType<typeof publicUser> | undefined;
    await session.withTransaction(async () => {
      const user = await findOrganizationUserById(organizationId, userId, session);
      if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
      const previousActive = user.active;
      const updated = await updateOrganizationUserActiveStatus(organizationId, userId, previousActive, active, session);
      if (!updated) throw new HttpError(409, 'USER_STATUS_CONFLICT', 'User status changed concurrently; reload and try again');
      user.active = active;
      if (!active) {
        await SessionModel.updateMany(
          { organizationId, userId: user._id, revokedAt: null },
          { $set: { revokedAt: new Date() } },
          { session },
        ).exec();
      }
      await recordAuditEvent({
        organizationId,
        userId: actorId,
        action: active ? 'user.activated' : 'user.deactivated',
        module: 'users',
        entity: 'User',
        entityId: String(user._id),
        ...(ip ? { ip } : {}),
        before: { active: previousActive },
        after: { active: user.active, email: user.email },
      }, session);
      result = publicUser(user);
    });
    if (!result) throw new Error('User status transaction returned no result');
    return result;
  } finally {
    await session.endSession();
  }
};
