import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';
import { serializeUser } from '../utils/serialize.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validateBody(registerSchema), async (req, res) => {
  const { token, user } = await authService.register(req.body);
  res.status(201).json({ token, user: serializeUser(user) });
});

authRouter.post('/login', authRateLimiter, validateBody(loginSchema), async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.json({ token, user: serializeUser(user) });
});

authRouter.get('/me', authenticate, async (req, res) => {
  res.json({ user: serializeUser(req.user!) });
});
