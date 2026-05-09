import { type NotificationsState } from './notificationsState';
import { NotificationFilter } from './NotificationFilter';

export interface NotificationsContextType extends NotificationsState {
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: (filter?: NotificationFilter) => Promise<void>;
  loadMoreNotifications: (filter?: NotificationFilter) => Promise<void>;
  clearError: () => void;
}
