export type UserRole = 'admin' | 'manager' | 'driver' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  lastLoginAt?: string | null;
  created_at?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  driver: 'Driver',
  viewer: 'Viewer',
};
