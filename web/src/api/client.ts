import axios from 'axios';

/**
 * Axios client for the Mensajería API.
 *
 * - Adds Authorization Bearer token on every request
 * - On 401, attempts a transparent refresh via httpOnly cookie
 * - Queues concurrent requests during refresh to avoid race conditions
 * - On refresh failure, redirects to /login
 */

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token management (in-memory only — not localStorage) ────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Request interceptor: attach Bearer token ────────────────────────

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response interceptor: handle 401 with auto-refresh ──────────────

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

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? ''}/v1/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken: string = data.data.accessToken;
        setAccessToken(newToken);

        pendingRequests.forEach((p) => p.resolve(newToken));
        pendingRequests = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        pendingRequests.forEach((p) => p.reject(refreshError));
        pendingRequests = [];
        window.location.href = `${import.meta.env.BASE_URL}login`;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Helpers ─────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

// ── Search helper ────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  sentAt: string;
  createdAt: string;
  recipientIds?: string[];
}

export interface SearchResponse {
  data: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
}

export async function searchMessages(
  q: string,
  page = 1,
  pageSize = 20,
): Promise<SearchResponse> {
  const { data } = await apiClient.get('/messages/search', {
    params: { q, page, pageSize },
  });
  return data.data; // { data: SearchResult[], total, page, pageSize }
}

export default apiClient;
