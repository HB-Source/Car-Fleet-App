import { Schema, model, type Document, type Types } from 'mongoose';

export type UserRole = 'admin' | 'manager' | 'driver' | 'viewer';

export const USER_ROLES: UserRole[] = ['admin', 'manager', 'driver', 'viewer'];

/** Purpose of the currently-stored email OTP. */
export type EmailOtpPurpose = 'verify' | 'login';

export interface UserDoc extends Document<Types.ObjectId> {
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  active: boolean;

  emailVerified: boolean;
  emailOtpHash: string | null;
  emailOtpPurpose: EmailOtpPurpose | null;
  emailOtpExpiresAt: Date | null;
  emailOtpAttempts: number;
  emailOtpLastSentAt: Date | null;

  failedLoginAttempts: number;
  accountLockedUntil: Date | null;

  mfaEnabled: boolean;
  /** Active TOTP secret once enabled, or the pending secret during setup. */
  mfaSecret: string | null;
  /** Whether mfaSecret is a not-yet-confirmed setup secret. */
  mfaPending: boolean;
  mfaBackupCodesHash: string[];

  lastLoginAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Sensitive fields are never selected by default.
    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'driver', index: true },
    active: { type: Boolean, default: true },

    emailVerified: { type: Boolean, default: false },
    emailOtpHash: { type: String, default: null, select: false },
    emailOtpPurpose: { type: String, enum: ['verify', 'login'], default: null, select: false },
    emailOtpExpiresAt: { type: Date, default: null, select: false },
    emailOtpAttempts: { type: Number, default: 0, select: false },
    emailOtpLastSentAt: { type: Date, default: null, select: false },

    failedLoginAttempts: { type: Number, default: 0, select: false },
    accountLockedUntil: { type: Date, default: null, select: false },

    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null, select: false },
    mfaPending: { type: Boolean, default: false, select: false },
    mfaBackupCodesHash: { type: [String], default: [], select: false },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = model<UserDoc>('User', userSchema);
