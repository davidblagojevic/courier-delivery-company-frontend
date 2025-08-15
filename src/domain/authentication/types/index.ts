export interface UserInfo {
  id: string;
  email: string;
  roles: string[];
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
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