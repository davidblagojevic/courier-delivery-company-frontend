export enum UserRole {
  ADMINISTRATOR = 'Administrator',
  CUSTOMER = 'Customer',
  COURIER = 'Courier'
}

export const hasRole = (userRoles: string[] | undefined, role: UserRole): boolean => {
  return userRoles?.includes(role) ?? false;
};

export const isAdmin = (userRoles: string[] | undefined): boolean => {
  return hasRole(userRoles, UserRole.ADMINISTRATOR);
};

export const isCustomer = (userRoles: string[] | undefined): boolean => {
  return hasRole(userRoles, UserRole.CUSTOMER);
};

export const isCourier = (userRoles: string[] | undefined): boolean => {
  return hasRole(userRoles, UserRole.COURIER);
};