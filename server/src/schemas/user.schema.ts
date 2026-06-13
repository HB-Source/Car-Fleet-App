import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
  role: z.enum(['admin', 'driver']).default('driver'),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    password: z.string().min(8).max(128),
    role: z.enum(['admin', 'driver']),
    active: z.boolean(),
  })
  .partial();

export const listUsersQuerySchema = z.object({
  role: z.enum(['admin', 'driver']).optional(),
  active: z.enum(['true', 'false']).optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
