import { clearToken, getToken } from '../lib/authToken';

const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');

/**
 * True when a backend API is configured. When false the app runs in demo
 * mode against the local sample dataset.
 */
export const isApiConfigured = Boolean(baseUrl);

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = 'error',
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip the automatic redirect-to-login on 401 (used by auth endpoints). */
  skipAuthRedirect?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!baseUrl) {
    throw new ApiRequestError(0, 'No API configured', 'no_api');
  }

  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiRequestError(0, 'Cannot reach the server. Check your connection.', 'network');
  }

  if (res.status === 401 && !options.skipAuthRedirect) {
    clearToken();
    window.location.hash = '#/login';
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response body
  }

  if (!res.ok) {
    const err = (payload as { error?: { message?: string; code?: string } } | null)?.error;
    throw new ApiRequestError(
      res.status,
      err?.message ?? `Request failed (${res.status})`,
      err?.code ?? 'error',
    );
  }

  return payload as T;
}
