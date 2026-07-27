import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginInput, RegisterInput } from '@transparency-ph/shared-types';
import { apiRequest } from '../lib/apiClient';
import { setAccessToken } from '../lib/authToken';
import type { AuthResponse, AuthUser, MeResponse, RefreshResponse } from '../lib/types';

// The access token lives only in memory (via lib/authToken.ts), not
// localStorage - it's short-lived (15m, per the API's JWT_ACCESS_EXPIRES_IN)
// so the exposure window from an XSS-read of localStorage is small either
// way, but there's no reason to persist it when the refresh token can
// mint a new one on every page load. The refresh token DOES need to
// persist (that's the whole point - "stay signed in" across reloads), and
// this app has no cookie-setting endpoint built yet (Phase 7 returns
// tokens in the JSON body, not a Set-Cookie header), so localStorage is
// the only persistence available. A future phase could move to an
// httpOnly refresh cookie set by the API for a stronger XSS boundary;
// noted as a scope simplification, not an oversight.
const REFRESH_TOKEN_STORAGE_KEY = 'transparency-ph:refreshToken';

interface AuthContextValue {
  user: AuthUser | null;
  // True once the initial silent-refresh check (on app load) has
  // finished, whether it succeeded or not. Consumers use this to avoid
  // flashing "Sign in" for someone who's actually already logged in via a
  // stored refresh token.
  isAuthReady: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(tokens: AuthResponse) {
  setAccessToken(tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
}

function clearSession() {
  setAccessToken(null);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // React 18 StrictMode double-invokes effects in dev - this guard makes
  // sure the silent-refresh call only actually fires once per app load,
  // not twice, same rationale as MapView.tsx's mount-once effect.
  const hasAttemptedSilentRefresh = useRef(false);

  useEffect(() => {
    if (hasAttemptedSilentRefresh.current) return;
    hasAttemptedSilentRefresh.current = true;

    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!storedRefreshToken) {
      setIsAuthReady(true);
      return;
    }

    (async () => {
      try {
        const { accessToken } = await apiRequest<RefreshResponse>('/auth/refresh', {
          method: 'POST',
          body: { refreshToken: storedRefreshToken },
        });
        setAccessToken(accessToken);
        const me = await apiRequest<MeResponse>('/auth/me');
        setUser(me.data);
      } catch {
        // Expired/invalid refresh token, or the API being unreachable -
        // either way, fall back to signed-out instead of leaving the UI
        // stuck waiting forever.
        clearSession();
      } finally {
        setIsAuthReady(true);
      }
    })();
  }, []);

  async function login(input: LoginInput) {
    const result = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input });
    persistSession(result);
    setUser(result.user);
  }

  async function register(input: RegisterInput) {
    const result = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input });
    persistSession(result);
    setUser(result.user);
  }

  function logout() {
    // Client-side only - there's no server-side session/refresh-token
    // store to revoke against (see the Phase 7 README note), so this just
    // forgets the local tokens rather than calling an endpoint.
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthReady, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
