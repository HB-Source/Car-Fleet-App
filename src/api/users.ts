import { apiRequest } from './client';
import type { User, UserRole } from '../types/user';

export async function fetchUsers(params?: { role?: UserRole }): Promise<User[]> {
  const query = params?.role ? `?role=${params.role}&limit=200` : '?limit=200';
  const res = await apiRequest<{ data: User[] }>(`/api/users${query}`);
  return res.data;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<User> {
  const res = await apiRequest<{ user: User }>('/api/users', { method: 'POST', body: input });
  return res.user;
}

export async function updateUser(
  id: string,
  changes: Partial<Pick<User, 'name' | 'role' | 'active'>> & { password?: string },
): Promise<User> {
  const res = await apiRequest<{ user: User }>(`/api/users/${id}`, {
    method: 'PATCH',
    body: changes,
  });
  return res.user;
}
