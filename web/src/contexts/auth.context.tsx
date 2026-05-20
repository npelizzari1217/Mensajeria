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

export interface EmpresaInfo {
  id: string;
  nombre: string;
  role: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<EmpresaInfo[]>;
  selectEmpresa: (empresaId: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  empresas: EmpresaInfo[];
  empresaId: string | null;
  pendingEmpresaSelection: boolean;
}

// ── Context ─────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaInfo[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [pendingEmpresaSelection, setPendingEmpresaSelection] = useState(false);

  // On mount, attempt to restore session via refresh-token cookie
  useEffect(() => {
    let cancelled = false;

    const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
    if (isAuthPage) {
      setIsLoading(false);
      return;
    }

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
        setEmpresaId(null);
        setEmpresas([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<EmpresaInfo[]> => {
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      const { accessToken: token, user: userData, empresas: empresasData } = data.data;
      setAccessToken(token);
      setUser(userData);

      if (empresasData && empresasData.length > 0) {
        setEmpresas(empresasData);
        if (empresasData.length === 1) {
          const empresa = empresasData[0];
          const { data: selectData } = await apiClient.post('/auth/select-empresa', { empresaId: empresa.id });
          setAccessToken(selectData.data.accessToken);
          setEmpresaId(empresa.id);
          setPendingEmpresaSelection(false);
        } else {
          setPendingEmpresaSelection(true);
        }
      } else {
        setPendingEmpresaSelection(false);
      }

      return empresasData ?? [];
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const selectEmpresa = useCallback(async (empresaIdParam: string) => {
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/select-empresa', { empresaId: empresaIdParam });
      setAccessToken(data.data.accessToken);
      setEmpresaId(empresaIdParam);
      setPendingEmpresaSelection(false);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setEmpresaId(null);
    setEmpresas([]);
    setPendingEmpresaSelection(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, selectEmpresa, logout, error, empresas, empresaId, pendingEmpresaSelection }}
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
