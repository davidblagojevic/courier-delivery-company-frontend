import { type AddressInfo } from './addressInfo';

export interface User {
  id: string;
  userName: string;
  email: string;
  role: string;
  contactPhone?: string;
  lockoutEnd?: string;
  emailConfirmed: boolean;
  isActive: boolean;
  workTitle?: string;
  courierStatus?: string;
  address?: AddressInfo;
}
