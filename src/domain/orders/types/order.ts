import { VehicleInfo } from './vehicle';
import { AddressInfo } from './address';
import { FeedbackInfo } from './feedback';

export interface CourierInfo {
  id: string;
  email: string;
  contactPhone?: string;
}

export interface OrderDetails {
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
  vehicle: VehicleInfo;
  collectionAddress: AddressInfo;
  deliveryAddress: AddressInfo;
  feedback?: FeedbackInfo;
  courier?: CourierInfo;
}