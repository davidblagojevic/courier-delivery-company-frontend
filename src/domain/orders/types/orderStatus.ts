export enum OrderStatus {
  CREATED = 'Created',
  ASSIGNED_TO_COURIER = 'AssignedToCourier',
  DELIVERED = 'Delivered',
  COMPLETED = 'Completed'
}

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: 'Created',
  [OrderStatus.ASSIGNED_TO_COURIER]: 'Assigned to Courier',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.COMPLETED]: 'Completed'
};

export const getStatusColor = (status: string): 'info' | 'warning' | 'success' | 'error' | 'default' => {
  switch (status) {
    case OrderStatus.CREATED:
      return 'info';
    case OrderStatus.ASSIGNED_TO_COURIER:
      return 'warning';
    case OrderStatus.DELIVERED:
      return 'success';
    case OrderStatus.COMPLETED:
      return 'success';
    default:
      return 'default';
  }
};

export const isOrderInStatus = (orderStatus: string, targetStatus: OrderStatus): boolean => {
  return orderStatus.toLowerCase() === targetStatus.toLowerCase();
};

export const canAssignCourier = (orderStatus: string): boolean => {
  return isOrderInStatus(orderStatus, OrderStatus.CREATED);
};

export const canMarkAsDelivered = (orderStatus: string): boolean => {
  return isOrderInStatus(orderStatus, OrderStatus.ASSIGNED_TO_COURIER);
};

export const canMarkAsCompleted = (orderStatus: string): boolean => {
  return isOrderInStatus(orderStatus, OrderStatus.DELIVERED);
};

export const canAddFeedback = (orderStatus: string): boolean => {
  return isOrderInStatus(orderStatus, OrderStatus.COMPLETED);
};