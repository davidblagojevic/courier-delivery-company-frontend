import { type AdminDashboard } from './adminDashboard';
import { type CustomerDashboard } from './customerDashboard';
import { type CourierDashboard } from './courierDashboard';

export interface DashboardResponse {
  role: string;
  admin: AdminDashboard | null;
  customer: CustomerDashboard | null;
  courier: CourierDashboard | null;
}
