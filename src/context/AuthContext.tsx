/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { isApiConfigured } from '../api/client';
import * as authApi from '../api/auth';
import { clearToken, getToken, setToken } from '../lib/authToken';
import type { User } from '../types/user';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

/** Synthetic identity used in demo mode so route guards pass. */
const DEMO_USER: User = {
  id: 'demo-admin',
  email: 'demo@fleetpilot.app',
  name: 'Demo Admin',
  role: 'admin',
  active: true,
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: 'loading',
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(isApiConfigured ? null : DEMO_USER);
  const [status, setStatus] = useState<AuthStatus>(
    isApiConfigured ? 'loading' : 'authenticated',
  );

  useEffect(() => {
    if (!isApiConfigured) return;
    if (!getToken()) {
      setStatus('unauthenticated');
      return;
    }
    let cancelled = false;
    authApi
      .fetchMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: me } = await authApi.login(email, password);
    setToken(token);
    setUser(me);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user: me } = await authApi.register(name, email, password);
    setToken(token);
    setUser(me);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, status, isAdmin: user?.role === 'admin', login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
