import { axiosClient } from '../../../api/axiosClient';
import { NotificationFilter } from '../types/NotificationFilter';

export interface Notification {
  id: string;
  orderId: string;
  message: string;
  createdAt: string;
  notificationStatus: string;
  isRead: boolean;
}

export interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

export class NotificationsApi {
  private static readonly BASE_URL = '/api/notifications';

  static async getNotifications(
    filter: NotificationFilter = NotificationFilter.All, 
    skip: number = 0, 
    take: number = 10
  ): Promise<NotificationsResponse> {
    const response = await axiosClient.get(
      `${this.BASE_URL}?filter=${filter}&skip=${skip}&take=${take}`
    );
    return response.data;
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await axiosClient.post(`${this.BASE_URL}/${notificationId}/mark-read`);
  }
}