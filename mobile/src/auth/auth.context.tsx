/**
 * AuthContext for the Mensajería mobile app.
 *
 * Ported from web/src/contexts/auth.context.tsx with mobile adaptations:
 *  - Tokens stored in SecureStore (not in-memory only)
 *  - restoreSession reads refreshToken from SecureStore → POSTs to /auth/refresh with body
 *  - login saves access + refresh to SecureStore
 *  - logout clears SecureStore (no window.location — navigation handled by RootNavigator reacting to isAuthenticated)
 *  - register() added (not present in web v1)
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import apiClient, { setAccessToken, getErrorMessage } from '../api/client';
import { tokenStorage } from './storage';

// ── Types ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  /** True while the session restore is in-flight on app mount */
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── restoreSession ───────────────────────────────────────────────

  const restoreSession = useCallback(async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        // No token stored — go straight to auth stack
        return;
      }

      const { data } = await apiClient.post('/auth/refresh', { refreshToken });
      const { accessToken: token, refreshToken: newRefresh, user: userData } =
        data.data as { accessToken: string; refreshToken: string; user: UserProfile };

      setAccessToken(token);
      await tokenStorage.setTokens(token, newRefresh);
      setUser(userData);
    } catch {
      // Refresh failed — treat as logged out
      setAccessToken(null);
      await tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run once on mount
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await restoreSession();
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      if (cancelled) return; // cleanup guard (state already set above)
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  // ── login ────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      const { accessToken: token, refreshToken, user: userData } =
        data.data as { accessToken: string; refreshToken: string; user: UserProfile };

      setAccessToken(token);
      await tokenStorage.setTokens(token, refreshToken);
      setUser(userData);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  }, []);

  // ── register ─────────────────────────────────────────────────────

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      try {
        const { data } = await apiClient.post('/auth/register', {
          name,
          email,
          password,
        });
        const { accessToken: token, refreshToken, user: userData } =
          data.data as { accessToken: string; refreshToken: string; user: UserProfile };

        setAccessToken(token);
        await tokenStorage.setTokens(token, refreshToken);
        setUser(userData);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw new Error(message);
      }
    },
    [],
  );

  // ── logout ───────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      // Best-effort server-side invalidation (ignore errors)
      await apiClient.post('/auth/logout').catch(() => undefined);
    } finally {
      setAccessToken(null);
      await tokenStorage.clear();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook (also exported from useAuth.ts for convenience) ─────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
}
