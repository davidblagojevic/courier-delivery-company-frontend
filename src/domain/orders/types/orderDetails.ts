import { type VehicleInfo } from './vehicle';
import { type AddressInfo } from './address';
import { type FeedbackInfo } from './feedback';
import { type CourierInfo } from './courierInfo';

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
