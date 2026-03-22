import { OrderCountsByStatus } from './orderCountsByStatus';
import { UserCounts } from './userCounts';
import { CourierAvailability } from './courierAvailability';
import { VehicleSummary } from './vehicleSummary';

export interface AdminDashboard {
  orderCounts: OrderCountsByStatus;
  userCounts: UserCounts;
  courierAvailability: CourierAvailability;
  vehicleSummary: VehicleSummary;
}
