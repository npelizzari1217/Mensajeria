/**
 * Axios client for the Mensajería mobile app.
 *
 * Differences from web/src/api/client.ts:
 *  - baseURL from Expo Constants (app.config.ts `extra.apiUrl`) or EXPO_PUBLIC_API_URL env var
 *  - Tokens come from/go to expo-secure-store (not memory + httpOnly cookie)
 *  - On 401 → refresh via POST body { refreshToken } (not cookie)
 *  - On refresh failure → tokenStorage.clear() + navigate to Login (not window.location)
 *  - No withCredentials (cookies not used in native)
 *
 * Token lifecycle:
 *  - Access token is kept in module-level variable (in-memory) for perf
 *  - Refresh token is always read fresh from SecureStore (survivability across restarts)
 */
import axios from 'axios';
import Constants from 'expo-constants';
import { tokenStorage } from '../auth/storage';
import { resetToLogin } from '../navigation/navigationRef';

// ── Base URL resolution ──────────────────────────────────────────────

const baseURL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000';

const apiClient = axios.create({
  baseURL: `${baseURL}/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// ── In-memory access token (set by AuthContext on login/restore) ─────

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Request interceptor: attach Bearer token ─────────────────────────

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response interceptor: handle 401 with one auto-refresh ───────────

let isRefreshing = false;

type PendingRequest = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};
let pendingRequests: PendingRequest[] = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // ── Queue concurrent requests that arrive while refreshing ────────
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Read refresh token from SecureStore (survives app restarts)
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token stored');
      }

      // POST /v1/auth/refresh with body (mobile uses body, not cookie)
      const { data } = await axios.post(`${baseURL}/v1/auth/refresh`, {
        refreshToken,
      });

      // API response shape: { data: { accessToken, refreshToken, user } }
      const newAccess: string = data.data.accessToken;
      const newRefresh: string = data.data.refreshToken;

      setAccessToken(newAccess);
      await tokenStorage.setTokens(newAccess, newRefresh);

      // Drain the queue with the new token
      pendingRequests.forEach((p) => p.resolve(newAccess));
      pendingRequests = [];

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed — clear storage and force re-login
      setAccessToken(null);
      await tokenStorage.clear();
      pendingRequests.forEach((p) => p.reject(refreshError));
      pendingRequests = [];
      resetToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Error message helper ─────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
    return error.response.data.error.message as string;
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

export default apiClient;
