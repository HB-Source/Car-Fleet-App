const ACCESS_KEY = 'fleetpilot_token';
const REFRESH_KEY = 'fleetpilot_refresh';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable — session won't persist across reloads
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  return read(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return read(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  write(ACCESS_KEY, accessToken);
  if (refreshToken) write(REFRESH_KEY, refreshToken);
}

export function clearToken(): void {
  remove(ACCESS_KEY);
  remove(REFRESH_KEY);
}
