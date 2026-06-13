export type UserRole = 'admin' | 'driver';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  created_at?: string;
}
