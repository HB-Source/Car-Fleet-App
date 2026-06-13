import { User, type UserDoc } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';
import type { CreateUserInput, UpdateUserInput } from '../schemas/user.schema.js';

interface ListUsersParams {
  role?: 'admin' | 'driver';
  active?: 'true' | 'false';
  q?: string;
  page: number;
  limit: number;
}

export async function listUsers(params: ListUsersParams) {
  const filter: Record<string, unknown> = {};
  if (params.role) filter.role = params.role;
  if (params.active) filter.active = params.active === 'true';
  if (params.q) {
    const rx = new RegExp(params.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit),
    User.countDocuments(filter),
  ]);

  return { users, total };
}

export async function createUser(input: CreateUserInput): Promise<UserDoc> {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', 'email_taken');
  }

  return User.create({
    email: input.email,
    name: input.name,
    role: input.role,
    password_hash: await hashPassword(input.password),
  });
}

export async function getUser(id: string): Promise<UserDoc> {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actor: UserDoc,
): Promise<UserDoc> {
  const user = await getUser(id);
  const isSelf = actor._id.equals(user._id);

  if (actor.role !== 'admin') {
    // Non-admins may only change their own name/password.
    if (!isSelf) throw ApiError.forbidden();
    if (input.role !== undefined || input.active !== undefined) {
      throw ApiError.forbidden('Only admins can change roles or account status');
    }
  }

  if (isSelf && input.role && input.role !== 'admin') {
    throw ApiError.badRequest('You cannot demote your own account', 'self_demote');
  }
  if (isSelf && input.active === false) {
    throw ApiError.badRequest('You cannot deactivate your own account', 'self_deactivate');
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.role !== undefined) user.role = input.role;
  if (input.active !== undefined) user.active = input.active;
  if (input.password !== undefined) user.password_hash = await hashPassword(input.password);

  await user.save();
  return user;
}

export async function deleteUser(id: string, actor: UserDoc): Promise<void> {
  if (actor._id.toString() === id) {
    throw ApiError.badRequest('You cannot delete your own account', 'self_delete');
  }

  const user = await getUser(id);

  // Soft delete: deactivate and unassign their vehicles.
  user.active = false;
  await user.save();
  await Vehicle.updateMany({ assigned_driver: user._id }, { $set: { assigned_driver: null } });
}
