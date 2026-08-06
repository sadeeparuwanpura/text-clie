import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useSessionStore } from '../store/session.store';

const AUTH_ROUTES_EXEMPT_FROM_REFRESH = ['/auth/login', '/auth/refresh'];

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://text-ser.onrender.com/api/v1',
  withCredentials: true, // carries the HttpOnly refresh cookie
});

httpClient.interceptors.request.use((config) => {
  const { accessToken } = useSessionStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Coalesces concurrent 401s into a single refresh call rather than one per failed request.
let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = httpClient
      .post<{ accessToken: string }>('/auth/refresh')
      .then((res) => {
        useSessionStore.getState().updateAccessToken(res.data.accessToken);
        return res.data.accessToken;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isExempt = AUTH_ROUTES_EXEMPT_FROM_REFRESH.some((path) =>
      originalRequest?.url?.includes(path),
    );

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isExempt) {
      originalRequest._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return httpClient(originalRequest);
      } catch {
        useSessionStore.getState().clearSession();
      }
    }

    return Promise.reject(error);
  },
);

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  details?: unknown;
}

/** Extracts the { code, message, details? } envelope the backend always returns on error. */
export function toApiError(error: unknown): ApiErrorEnvelope {
  if (axios.isAxiosError(error) && error.response?.data) {
    return error.response.data as ApiErrorEnvelope;
  }
  return { code: 'NETWORK_ERROR', message: 'Could not reach the server. Check your connection.' };
}
