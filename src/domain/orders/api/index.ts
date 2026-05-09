import { api } from 'api';
import { type CreateFeedbackRequest } from '../types';

export const ordersApi = {
  addFeedback: async (orderId: string, feedback: CreateFeedbackRequest) => {
    const response = await api.post(
      `/api/orders/${orderId}/feedback?rating=${feedback.rating}&message=${encodeURIComponent(feedback.message || '')}`
    );
    return response.data;
  },

  markAsCompleted: async (orderId: string) => {
    const response = await api.post(`/api/orders/${orderId}/completed`);
    return response.data;
  },
};
