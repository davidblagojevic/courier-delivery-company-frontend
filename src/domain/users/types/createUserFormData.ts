import { UserRole } from 'domain/authentication/types/userRoles';

export interface CreateUserFormData {
  email: string;
  password: string;
  contactPhone?: string;
  workTitle?: string;
  role: UserRole.ADMINISTRATOR | UserRole.COURIER;
}
