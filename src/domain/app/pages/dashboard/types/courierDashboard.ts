import { OrderCountsByStatus } from './orderCountsByStatus';

export interface CourierDashboard {
  orderCounts: OrderCountsByStatus;
  currentStatus: string;
  todaysDeliveries: number;
  averageRating: number | null;
  totalDeliveriesCompleted: number;
}
