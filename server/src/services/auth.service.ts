import { User, type UserDoc } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';

export interface AuthResult {
  token: string;
  user: UserDoc;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', 'email_taken');
  }

  // Public registration always creates drivers; admins are created via
  // the seed script or by another admin through POST /api/users.
  const user = await User.create({
    email: input.email,
    name: input.name,
    role: 'driver',
    password_hash: await hashPassword(input.password),
  });

  return { token: signToken({ sub: user._id.toString(), role: user.role }), user };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password_hash');
  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    throw ApiError.unauthorized('Invalid email or password', 'invalid_credentials');
  }
  if (!user.active) {
    throw ApiError.unauthorized('This account has been deactivated', 'account_inactive');
  }

  return { token: signToken({ sub: user._id.toString(), role: user.role }), user };
}
