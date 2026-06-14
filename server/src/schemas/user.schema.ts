import { z } from 'zod';
import { USER_ROLES } from '../models/User.js';

const roleEnum = z.enum(USER_ROLES as [string, ...string[]]);

export const createUserSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
  role: roleEnum.default('driver'),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    password: z.string().min(8).max(128),
    role: roleEnum,
    active: z.boolean(),
  })
  .partial();

export const listUsersQuerySchema = z.object({
  role: roleEnum.optional(),
  active: z.enum(['true', 'false']).optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
