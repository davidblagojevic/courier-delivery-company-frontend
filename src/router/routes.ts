export const INDEX = "/";

export const LOGIN = "/login";
export const REGISTER = "/register";
export const FORGOT_PASSWORD = "/forgot-password";
export const RESET_PASSWORD = "/reset-password";

export const DASHBOARD = "/dashboard";

export const ORDERS = "/orders";
export const ORDERS_CREATE = "/orders/create";
export const ORDER_DETAILS = "/orders/:orderId";
export const orderDetails = (id: string) => `/orders/${id}`;

export const NOTIFICATIONS = "/notifications";
export const SETTINGS = "/settings";

export const ADMIN_VEHICLES = "/admin/vehicles";
export const ADMIN_USERS = "/admin/users";
export const ADMIN_VEHICLE_AVAILABILITY_RULES = "/admin/vehicle-availability-rules";
