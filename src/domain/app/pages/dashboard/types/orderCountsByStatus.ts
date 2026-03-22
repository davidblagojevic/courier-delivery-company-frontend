export interface OrderCountsByStatus {
  created: number;
  assignedToCourier: number;
  delivered: number;
  completed: number;
  total: number;
}
