import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { axiosClient } from '../../../api/axiosClient';

export interface UserInfo {
  id: string;
  email: string;
  roles: string[];
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
  clearError: () => void;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { tokenData: TokenData; userInfo: UserInfo } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { tokenData: TokenData; userInfo: UserInfo } }
  | { type: 'REFRESH_START' }
  | { type: 'REFRESH_SUCCESS'; payload: { tokenData: TokenData } }
  | { type: 'REFRESH_FAILURE' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  tokenExpiresAt: null,
  userInfo: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.tokenData.accessToken,
        refreshToken: action.payload.tokenData.refreshToken,
        tokenExpiresAt: action.payload.tokenData.expiresAt,
        userInfo: action.payload.userInfo,
        isLoading: false,
        error: null,
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        tokenExpiresAt: null,
        userInfo: null,
        isLoading: false,
        error: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
      };
    
    case 'RESTORE_SESSION':
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.tokenData.accessToken,
        refreshToken: action.payload.tokenData.refreshToken,
        tokenExpiresAt: action.payload.tokenData.expiresAt,
        userInfo: action.payload.userInfo,
      };
    
    case 'REFRESH_START':
      return {
        ...state,
        isRefreshing: true,
        error: null,
      };
    
    case 'REFRESH_SUCCESS':
      return {
        ...state,
        token: action.payload.tokenData.accessToken,
        refreshToken: action.payload.tokenData.refreshToken,
        tokenExpiresAt: action.payload.tokenData.expiresAt,
        isRefreshing: false,
        error: null,
      };
    
    case 'REFRESH_FAILURE':
      return {
        ...initialState, // Logout user on refresh failure
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on app start
  useEffect(() => {
    const restoreSession = () => {
      try {
        const savedTokenData = localStorage.getItem('tokenData');
        const savedUserInfo = localStorage.getItem('userInfo');
        
        if (savedTokenData && savedUserInfo) {
          const tokenData: TokenData = JSON.parse(savedTokenData);
          const userInfo = JSON.parse(savedUserInfo);
          
          // Check if token is expired
          if (tokenData.expiresAt > Date.now()) {
            dispatch({
              type: 'RESTORE_SESSION',
              payload: { tokenData, userInfo }
            });
          } else {
            // Token expired, try to refresh
            refreshTokenSilently(tokenData.refreshToken);
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        clearStoredAuth();
      }
    };

    restoreSession();
  }, []);

  // Listen for token refresh events from API client
  useEffect(() => {
    const handleTokenRefreshed = (event: CustomEvent) => {
      const { tokenData } = event.detail;
      if (state.userInfo) {
        dispatch({
          type: 'REFRESH_SUCCESS',
          payload: { tokenData }
        });
      }
    };

    const handleLogout = () => {
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('auth:tokenRefreshed', handleTokenRefreshed as EventListener);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:tokenRefreshed', handleTokenRefreshed as EventListener);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [state.userInfo]);

  const clearStoredAuth = () => {
    localStorage.removeItem('tokenData');
    localStorage.removeItem('userInfo');
  };

  const storeTokenData = (tokenData: TokenData, userInfo: UserInfo) => {
    localStorage.setItem('tokenData', JSON.stringify(tokenData));
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  };

  const parseTokenExpiry = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.exp || 0) * 1000; // Convert to milliseconds
    } catch {
      // Fallback: assume 1 hour expiry
      return Date.now() + (60 * 60 * 1000);
    }
  };

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!state.refreshToken || state.isRefreshing) {
      return null;
    }

    dispatch({ type: 'REFRESH_START' });

    try {
      const response = await axiosClient.post('/identity/refresh', {
        refreshToken: state.refreshToken
      });

      const data = response.data;
      
      const tokenData: TokenData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: parseTokenExpiry(data.accessToken),
      };

      // Update stored data
      if (state.userInfo) {
        storeTokenData(tokenData, state.userInfo);
      }

      dispatch({
        type: 'REFRESH_SUCCESS',
        payload: { tokenData },
      });

      return tokenData.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'REFRESH_FAILURE' });
      clearStoredAuth();
      return null;
    }
  }, [state.refreshToken, state.isRefreshing, state.userInfo]);

  const logout = useCallback((): void => {
    clearStoredAuth();
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Monitor token expiration and auto-refresh
  useEffect(() => {
    if (!state.isAuthenticated || !state.tokenExpiresAt || !state.refreshToken) {
      return;
    }

    const now = Date.now();
    const expiresAt = state.tokenExpiresAt;
    const timeUntilExpiry = expiresAt - now;
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry

    if (timeUntilExpiry <= refreshThreshold && timeUntilExpiry > 0) {
      // Token expires soon, refresh it
      refreshAccessToken();
      return;
    }

    if (timeUntilExpiry <= 0) {
      // Token already expired
      logout();
      return;
    }

    // Set timer to refresh token before it expires
    const timeoutId = setTimeout(() => {
      refreshAccessToken();
    }, timeUntilExpiry - refreshThreshold);

    return () => clearTimeout(timeoutId);
  }, [state.tokenExpiresAt, state.isAuthenticated, state.refreshToken, refreshAccessToken, logout]);

  const refreshTokenSilently = async (refreshToken: string) => {
    try {
      const response = await axiosClient.post('/identity/refresh', {
        refreshToken
      });

      const data = response.data;
      const tokenData: TokenData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: parseTokenExpiry(data.accessToken),
      };

      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      dispatch({
        type: 'RESTORE_SESSION',
        payload: { tokenData, userInfo }
      });
      storeTokenData(tokenData, userInfo);
    } catch (error) {
      console.error('Silent token refresh failed:', error);
      clearStoredAuth();
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Login request using Axios
      const loginResponse = await axiosClient.post('/identity/login', {
        email,
        password
      });

      const loginData = loginResponse.data;

      // Create token data with expiry
      const tokenData: TokenData = {
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        expiresAt: parseTokenExpiry(loginData.accessToken),
      };

      // Store token data first so axios interceptor can find it
      localStorage.setItem('tokenData', JSON.stringify(tokenData));

      // Get user info using Axios (token will be added by interceptor)
      const userResponse = await axiosClient.get('/api/identity/me');
      const userInfo = userResponse.data;

      // Persist user info to localStorage
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          tokenData,
          userInfo,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error; // Re-throw to allow component-level handling if needed
    }
  };

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshAccessToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};