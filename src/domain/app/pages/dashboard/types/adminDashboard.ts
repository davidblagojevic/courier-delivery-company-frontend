import { type OrderCountsByStatus } from './orderCountsByStatus';
import { type UserCounts } from './userCounts';
import { type CourierAvailability } from './courierAvailability';
import { type VehicleSummary } from './vehicleSummary';

export interface AdminDashboard {
  orderCounts: OrderCountsByStatus;
  userCounts: UserCounts;
  courierAvailability: CourierAvailability;
  vehicleSummary: VehicleSummary;
}
