import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** Brute-force protection for login/registration. Relaxed under test. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: 'Too many attempts, please try again later', code: 'rate_limited' },
  },
});
