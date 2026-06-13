import { apiRequest } from './client';
import type { User } from '../types/user';

interface AuthResponse {
  token: string;
  user: User;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuthRedirect: true,
  });
}

export function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
    skipAuthRedirect: true,
  });
}

export async function fetchMe(): Promise<User> {
  const res = await apiRequest<{ user: User }>('/api/auth/me', { skipAuthRedirect: true });
  return res.user;
}
