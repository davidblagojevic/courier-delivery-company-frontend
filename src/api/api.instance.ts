import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { TokenData } from 'domain/authentication/types';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from 'domain/authentication/storage';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

const parseTokenExpiry = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.exp || 0) * 1000;
  } catch {
    return Date.now() + 60 * 60 * 1000;
  }
};

const readStoredTokens = (): TokenData | null => {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenData) : null;
  } catch {
    return null;
  }
};

const writeStoredTokens = (tokens: TokenData) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
};

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const api = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const unauthorizedApi = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const stored = readStoredTokens();
  if (stored?.accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${stored.accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeForRetry = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const notifySubscribers = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const stored = readStoredTokens();
    if (!stored?.refreshToken) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        subscribeForRetry((token) => {
          if (!token) {
            reject(error);
            return;
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(api.request(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshResponse = await unauthorizedApi.post<RefreshTokenResponse>(
        '/identity/refresh',
        { refreshToken: stored.refreshToken }
      );

      const { accessToken, refreshToken } = refreshResponse.data;
      const tokenData: TokenData = {
        accessToken,
        refreshToken,
        expiresAt: parseTokenExpiry(accessToken),
      };
      writeStoredTokens(tokenData);
      notifySubscribers(accessToken);
      window.dispatchEvent(
        new CustomEvent('auth:tokenRefreshed', { detail: { tokenData } })
      );

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return api.request(originalRequest);
    } catch (refreshError) {
      notifySubscribers(null);
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
