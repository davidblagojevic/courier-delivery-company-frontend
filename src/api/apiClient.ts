// HTTP client with automatic token refresh
class ApiClient {
  private refreshPromise: Promise<string | null> | null = null;

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getStoredToken();
    
    // Add authorization header if token exists
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized and we have a refresh token, try to refresh
    if (response.status === 401 && this.hasRefreshToken()) {
      const newToken = await this.handleTokenRefresh();
      
      if (newToken) {
        // Retry the original request with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });
      }
    }

    return response;
  }

  private getStoredToken(): string | null {
    try {
      const tokenData = localStorage.getItem('tokenData');
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        return parsed.accessToken;
      }
    } catch (error) {
      console.error('Error parsing stored token:', error);
    }
    return null;
  }

  private hasRefreshToken(): boolean {
    try {
      const tokenData = localStorage.getItem('tokenData');
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        return Boolean(parsed.refreshToken);
      }
    } catch (error) {
      console.error('Error checking refresh token:', error);
    }
    return false;
  }

  private async handleTokenRefresh(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    return result;
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const tokenData = localStorage.getItem('tokenData');
      if (!tokenData) {
        return null;
      }

      const parsed = JSON.parse(tokenData);
      if (!parsed.refreshToken) {
        return null;
      }

      const response = await fetch('/identity/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          refreshToken: parsed.refreshToken 
        }),
      });

      if (!response.ok) {
        // Refresh failed, clear stored tokens
        localStorage.removeItem('tokenData');
        localStorage.removeItem('userInfo');
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        return null;
      }

      const data = await response.json();
      
      // Parse token expiry
      const parseTokenExpiry = (token: string): number => {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return (payload.exp || 0) * 1000;
        } catch {
          return Date.now() + (60 * 60 * 1000);
        }
      };

      const newTokenData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: parseTokenExpiry(data.accessToken),
      };

      // Update stored token data
      localStorage.setItem('tokenData', JSON.stringify(newTokenData));
      
      // Dispatch token refresh event
      window.dispatchEvent(new CustomEvent('auth:tokenRefreshed', { 
        detail: { tokenData: newTokenData } 
      }));

      return newTokenData.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Clear stored tokens on error
      localStorage.removeItem('tokenData');
      localStorage.removeItem('userInfo');
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      return null;
    }
  }

  // Convenience methods for common HTTP verbs
  async get(url: string, options: Omit<RequestInit, 'method'> = {}) {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  async post(url: string, body?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put(url: string, body?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete(url: string, options: Omit<RequestInit, 'method'> = {}) {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export the class for testing
export default ApiClient;