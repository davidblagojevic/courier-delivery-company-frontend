import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { TokenData } from '../contexts/AuthContext';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

class AxiosClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];

  constructor() {
    this.axiosInstance = axios.create({
      //TODO: Set the base URL dynamically based on environment
      baseURL: '/',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add token to all requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getStoredAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh on 401
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, wait for the new token
            return this.createRetryPromise(originalRequest);
          }

          originalRequest._retry = true;

          if (this.hasRefreshToken()) {
            return this.handleTokenRefresh(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getStoredAccessToken(): string | null {
    try {
      const tokenData = localStorage.getItem('tokenData');
      if (tokenData) {
        const parsed: TokenData = JSON.parse(tokenData);
        return parsed.accessToken;
      }
    } catch (error) {
      console.error('Error parsing stored token:', error);
    }
    return null;
  }

  private getStoredRefreshToken(): string | null {
    try {
      const tokenData = localStorage.getItem('tokenData');
      if (tokenData) {
        const parsed: TokenData = JSON.parse(tokenData);
        return parsed.refreshToken;
      }
    } catch (error) {
      console.error('Error parsing stored refresh token:', error);
    }
    return null;
  }

  private hasRefreshToken(): boolean {
    return Boolean(this.getStoredRefreshToken());
  }

  private parseTokenExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.exp || 0) * 1000; // Convert to milliseconds
    } catch {
      // Fallback: assume 1 hour expiry
      return Date.now() + (60 * 60 * 1000);
    }
  }

  private async handleTokenRefresh(originalRequest: AxiosRequestConfig): Promise<AxiosResponse> {
    if (this.isRefreshing) {
      return this.createRetryPromise(originalRequest);
    }

    this.isRefreshing = true;

    try {
      const refreshToken = this.getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<RefreshTokenResponse>('/identity/refresh', {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Update stored token data
      const tokenData: TokenData = {
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt: this.parseTokenExpiry(accessToken),
      };

      localStorage.setItem('tokenData', JSON.stringify(tokenData));

      // Notify all waiting requests with the new token
      this.notifySubscribers(accessToken);

      // Dispatch token refresh event for AuthContext
      window.dispatchEvent(new CustomEvent('auth:tokenRefreshed', { 
        detail: { tokenData } 
      }));

      // Retry the original request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      return this.axiosInstance.request(originalRequest);
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Clear stored tokens
      localStorage.removeItem('tokenData');
      localStorage.removeItem('userInfo');
      
      // Notify subscribers of failure
      this.notifySubscribers(null);
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      return Promise.reject(error);
    } finally {
      this.isRefreshing = false;
      this.refreshSubscribers = [];
    }
  }

  private createRetryPromise(originalRequest: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      this.refreshSubscribers.push((token: string | null) => {
        if (token) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(this.axiosInstance.request(originalRequest));
        } else {
          reject(new Error('Token refresh failed'));
        }
      });
    });
  }

  private notifySubscribers(token: string | null): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  // Public methods
  get instance(): AxiosInstance {
    return this.axiosInstance;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, config);
  }
}

// Export singleton instance
export const axiosClient = new AxiosClient();

// Export the class for testing
export default AxiosClient;