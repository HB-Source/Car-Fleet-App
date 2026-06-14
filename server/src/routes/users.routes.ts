import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireVerifiedEmail } from '../middleware/requireVerifiedEmail.js';
import { requireMfaVerified } from '../middleware/requireMfaVerified.js';
import { validateBody } from '../middleware/validate.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../schemas/user.schema.js';
import * as usersService from '../services/users.service.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeUser } from '../utils/serialize.js';

export const usersRouter = Router();

usersRouter.use(authenticate, requireVerifiedEmail, requireMfaVerified);

usersRouter.get('/', requireRole('admin'), async (req, res) => {
  const params = listUsersQuerySchema.parse(req.query);
  const { users, total } = await usersService.listUsers(params);
  res.json({
    data: users.map(serializeUser),
    meta: { page: params.page, limit: params.limit, total },
  });
});

usersRouter.post('/', requireRole('admin'), validateBody(createUserSchema), async (req, res) => {
  const user = await usersService.createUser(req.body);
  res.status(201).json({ user: serializeUser(user) });
});

usersRouter.get('/:id', async (req, res) => {
  if (req.user!.role !== 'admin' && req.user!._id.toString() !== String(req.params.id)) {
    throw ApiError.forbidden();
  }
  const user = await usersService.getUser(String(req.params.id));
  res.json({ user: serializeUser(user) });
});

usersRouter.patch('/:id', validateBody(updateUserSchema), async (req, res) => {
  const user = await usersService.updateUser(String(req.params.id), req.body, req.user!);
  res.json({ user: serializeUser(user) });
});

usersRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await usersService.deleteUser(String(req.params.id), req.user!);
  res.status(204).end();
});
