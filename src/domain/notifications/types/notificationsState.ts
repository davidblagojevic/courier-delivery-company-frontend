import { type Notification } from '../services/notificationsApi';

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isConnected: boolean;
  error: string | null;
}
