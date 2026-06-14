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
import { clearToken, getToken, setTokens } from '../lib/authToken';
import type { User, UserRole } from '../types/user';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface OtpStepResult {
  next: 'done' | 'mfa';
  mfaToken?: string;
}

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAdmin: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  register: (name: string, email: string, password: string) => Promise<{ email: string }>;
  beginLogin: (email: string, password: string) => Promise<authApi.LoginResponse>;
  submitEmailOtp: (email: string, code: string) => Promise<OtpStepResult>;
  submitMfa: (mfaToken: string, code: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

/** Synthetic identity used in demo mode so route guards pass. */
const DEMO_USER: User = {
  id: 'demo-admin',
  email: 'demo@fleetpilot.app',
  name: 'Demo Admin',
  role: 'admin',
  active: true,
  emailVerified: true,
  mfaEnabled: false,
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: 'loading',
  isAdmin: false,
  hasRole: () => false,
  register: async () => ({ email: '' }),
  beginLogin: async () => ({ email: '' }),
  submitEmailOtp: async () => ({ next: 'done' }),
  submitMfa: async () => {},
  resendOtp: async () => {},
  refreshUser: async () => {},
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

  const setSession = useCallback((session: authApi.SessionResponse) => {
    setTokens(session.accessToken, session.refreshToken);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(
    (name: string, email: string, password: string) => authApi.register(name, email, password),
    [],
  );

  const beginLogin = useCallback(
    (email: string, password: string) => authApi.login(email, password),
    [],
  );

  const submitEmailOtp = useCallback(
    async (email: string, code: string): Promise<OtpStepResult> => {
      const res = await authApi.verifyEmailOtp(email, code);
      if (res.mfaRequired) {
        return { next: 'mfa', mfaToken: res.mfaToken };
      }
      setSession({
        accessToken: res.accessToken!,
        refreshToken: res.refreshToken!,
        user: res.user!,
      });
      return { next: 'done' };
    },
    [setSession],
  );

  const submitMfa = useCallback(
    async (mfaToken: string, code: string) => {
      const session = await authApi.verifyMfaLogin(mfaToken, code);
      setSession(session);
    },
    [setSession],
  );

  const resendOtp = useCallback((email: string) => authApi.sendEmailOtp(email).then(() => {}), []);

  const refreshUser = useCallback(async () => {
    if (!isApiConfigured) return;
    try {
      setUser(await authApi.fetchMe());
    } catch {
      // ignore — handled elsewhere on next request
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    clearToken();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAdmin: user?.role === 'admin',
        hasRole,
        register,
        beginLogin,
        submitEmailOtp,
        submitMfa,
        resendOtp,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
