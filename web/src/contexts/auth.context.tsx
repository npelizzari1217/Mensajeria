import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import apiClient, { setAccessToken, getErrorMessage } from '../api/client';

// ── Types ───────────────────────────────────────────────────────────

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
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

// ── Context ─────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount, attempt to restore session via refresh-token cookie
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const { data } = await apiClient.post('/auth/refresh');
        if (cancelled) return;
        const { accessToken: token, user: userData } = data.data;
        setAccessToken(token);
        setUser(userData);
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      const { accessToken: token, user: userData } = data.data;
      setAccessToken(token);
      setUser(userData);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, error }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
}
