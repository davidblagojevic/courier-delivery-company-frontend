import { type OrderCountsByStatus } from './orderCountsByStatus';

export interface CustomerDashboard {
  orderCounts: OrderCountsByStatus;
  totalAmountSpent: number;
  ordersAwaitingFeedback: number;
}
