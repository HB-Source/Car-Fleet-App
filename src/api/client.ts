import { clearToken, getRefreshToken, getToken, setTokens } from '../lib/authToken';

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
  /** Skip the automatic refresh/redirect handling on 401 (auth endpoints). */
  skipAuthRedirect?: boolean;
  /** Internal: prevents infinite refresh recursion. */
  _isRetry?: boolean;
}

function extractError(payload: unknown, status: number): ApiRequestError {
  const p = payload as
    | { error?: { message?: string; code?: string }; message?: string }
    | null;
  // Fleet endpoints use { error: { message, code } }; auth endpoints use
  // { success:false, message }.
  const message = p?.error?.message ?? p?.message ?? `Request failed (${status})`;
  const code = p?.error?.code ?? 'error';
  return new ApiRequestError(status, message, code);
}

/** Attempt a token refresh once. Returns true on success. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken || !baseUrl) return false;
  try {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const data = json?.data;
    if (!data?.accessToken) return false;
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
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

  // Transparently refresh an expired access token once, then retry.
  if (res.status === 401 && !options.skipAuthRedirect && !options._isRetry) {
    if (await tryRefresh()) {
      return apiRequest<T>(path, { ...options, _isRetry: true });
    }
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
    throw extractError(payload, res.status);
  }

  return payload as T;
}
