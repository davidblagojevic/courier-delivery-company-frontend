import { apiClient } from '../../../api/apiClient';
import { CreateFeedbackRequest } from '../types';

export const ordersApi = {
  // Add feedback to an order
  addFeedback: async (orderId: string, feedback: CreateFeedbackRequest) => {
    const response = await apiClient.post(
      `/api/orders/${orderId}/feedback?rating=${feedback.rating}&message=${encodeURIComponent(feedback.message || '')}`,
      null
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to add feedback');
    }
    
    return response.json();
  },

  // Mark order as completed
  markAsCompleted: async (orderId: string) => {
    const response = await apiClient.post(`/api/orders/${orderId}/completed`);
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to mark order as completed');
    }
    
    return response.json();
  }
};