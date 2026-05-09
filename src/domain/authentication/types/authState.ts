import { type UserInfo } from './userInfo';

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
