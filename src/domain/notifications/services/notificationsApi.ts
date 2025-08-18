import { axiosClient } from '../../../api/axiosClient';

export interface Notification {
  id: string;
  orderId: string;
  message: string;
  createdAt: string;
  notificationStatus: string;
  isRead: boolean;
}

export class NotificationsApi {
  private static readonly BASE_URL = '/api/notifications';

  static async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    const response = await axiosClient.get(`${this.BASE_URL}?unreadOnly=${unreadOnly}`);
    return response.data;
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await axiosClient.post(`${this.BASE_URL}/${notificationId}/mark-read`);
  }
}