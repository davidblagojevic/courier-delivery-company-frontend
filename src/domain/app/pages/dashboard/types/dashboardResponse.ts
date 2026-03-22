import { AdminDashboard } from './adminDashboard';
import { CustomerDashboard } from './customerDashboard';
import { CourierDashboard } from './courierDashboard';

export interface DashboardResponse {
  role: string;
  admin: AdminDashboard | null;
  customer: CustomerDashboard | null;
  courier: CourierDashboard | null;
}
