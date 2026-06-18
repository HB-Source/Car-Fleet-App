import { Router, type NextFunction, type Request, type Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireVerifiedEmail } from '../middleware/requireVerifiedEmail.js';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import {
  loginSchema,
  registerSchema,
  sendEmailOtpSchema,
  verifyEmailOtpSchema,
  mfaVerifySchema,
  mfaDisableSchema,
  refreshSchema,
} from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';
import { serializeUser } from '../utils/serialize.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validateBody(registerSchema), async (req, res) => {
  const { email } = await authService.register(req.body);
  sendSuccess(
    res,
    { email, requiresEmailVerification: true },
    'Account created. Check your email for a verification code.',
    201,
  );
});

authRouter.post('/login', authRateLimiter, validateBody(loginSchema), async (req, res) => {
  const result = await authService.login(req.body);
  if (result.kind === 'email_verification') {
    sendSuccess(
      res,
      { email: result.email, requiresEmailVerification: true },
      'Please verify your email. We sent you a new code.',
    );
    return;
  }
  if (result.kind === 'mfa_required') {
    sendSuccess(
      res,
      { email: result.email, requiresMfa: true, mfaToken: result.mfaToken },
      'Enter the code from your authenticator app.',
    );
    return;
  }
  sendSuccess(
    res,
    { email: result.email, requiresOtp: true },
    'We emailed you a 6-digit login code.',
  );
});

authRouter.post('/send-email-otp', otpRateLimiter, validateBody(sendEmailOtpSchema), async (req, res) => {
  await authService.resendEmailOtp(req.body.email);
  sendSuccess(res, { email: req.body.email }, 'If an account exists, a code has been sent.');
});

authRouter.post('/verify-email-otp', otpRateLimiter, validateBody(verifyEmailOtpSchema), async (req, res) => {
  const result = await authService.verifyEmailOtp(req.body.email, req.body.code);
  if (result.kind === 'mfa_required') {
    sendSuccess(res, { mfaRequired: true, mfaToken: result.mfaToken }, 'Enter your authenticator code.');
    return;
  }
  sendSuccess(
    res,
    {
      mfaRequired: false,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: serializeUser(result.user),
    },
    'Signed in successfully.',
  );
});

// MFA setup confirmation requires a session; MFA login verification uses the
// short-lived mfaToken instead. Authenticate only when no mfaToken is present.
function conditionalAuth(req: Request, res: Response, next: NextFunction) {
  if (req.body?.mfaToken) return next();
  return authenticate(req, res, next);
}

authRouter.post('/mfa/setup', authenticate, requireVerifiedEmail, async (req, res) => {
  const setup = await authService.setupMfa(req.user!._id.toString());
  sendSuccess(res, setup, 'Scan the QR code, then confirm with a code to enable MFA.');
});

authRouter.post('/mfa/verify', validateBody(mfaVerifySchema), conditionalAuth, async (req, res) => {
  if (req.body.mfaToken) {
    const result = await authService.verifyMfaLogin(req.body.mfaToken, req.body.code);
    sendSuccess(
      res,
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: serializeUser(result.user),
      },
      'Signed in successfully.',
    );
    return;
  }
  await authService.confirmMfaSetup(req.user!._id.toString(), req.body.code);
  sendSuccess(res, { mfaEnabled: true }, 'Multi-factor authentication enabled.');
});

authRouter.post('/mfa/disable', authenticate, validateBody(mfaDisableSchema), async (req, res) => {
  await authService.disableMfa(req.user!._id.toString(), req.body.password);
  sendSuccess(res, { mfaEnabled: false }, 'Multi-factor authentication disabled.');
});

authRouter.post('/refresh', validateBody(refreshSchema), async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  sendSuccess(
    res,
    {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: serializeUser(result.user),
    },
    'Session refreshed.',
  );
});

authRouter.post('/logout', (_req, res) => {
  // Stateless JWTs: the client discards its tokens. Endpoint provided for
  // symmetry and future refresh-token revocation.
  sendSuccess(res, {}, 'Logged out.');
});

authRouter.get('/me', authenticate, (req, res) => {
  sendSuccess(res, { user: serializeUser(req.user!) }, 'Current user.');
});
