export interface Order {
  id: string;
  customerId: string;
  courierId?: string;
  orderStatus: string;
  totalPrice: number;
  vehicleId: string;
  orderDate: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  description?: string;
}
