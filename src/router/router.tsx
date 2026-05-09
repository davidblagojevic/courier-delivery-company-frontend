import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Public auth pages and the auth hook — eagerly loaded so unauthenticated users
// don't pay a chunk cost on the login screen.
import {
  useAuth,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from 'domain/authentication';
import { App } from 'domain/app';
import { FullPageSpinner } from 'shared/components';
import { ProtectedRoute } from './protected.route';
import * as routes from './routes';

// Protected pages — lazy-loaded; each becomes its own chunk.
const DashboardPage = lazy(() =>
  import('domain/app').then((m) => ({ default: m.DashboardPage }))
);
const OrdersPage = lazy(() =>
  import('domain/orders').then((m) => ({ default: m.OrdersPage }))
);
const CreateOrderPage = lazy(() =>
  import('domain/orders').then((m) => ({ default: m.CreateOrderPage }))
);
const OrderDetailsPage = lazy(() =>
  import('domain/orders').then((m) => ({ default: m.OrderDetailsPage }))
);
const NotificationsPage = lazy(() =>
  import('domain/notifications/components/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  }))
);
const SettingsPage = lazy(() =>
  import('domain/settings').then((m) => ({ default: m.SettingsPage }))
);
const VehicleManagementPage = lazy(() =>
  import('domain/vehicles').then((m) => ({ default: m.VehicleManagementPage }))
);
const VehicleAvailabilityRuleManagementPage = lazy(() =>
  import('domain/vehicles').then((m) => ({
    default: m.VehicleAvailabilityRuleManagementPage,
  }))
);
const UserManagementPage = lazy(() =>
  import('domain/users').then((m) => ({ default: m.UserManagementPage }))
);

export const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes (no app shell) */}
        <Route
          path={routes.LOGIN}
          element={!isAuthenticated ? <LoginPage /> : <Navigate to={routes.DASHBOARD} replace />}
        />
        <Route
          path={routes.REGISTER}
          element={!isAuthenticated ? <RegisterPage /> : <Navigate to={routes.DASHBOARD} replace />}
        />
        <Route
          path={routes.FORGOT_PASSWORD}
          element={
            !isAuthenticated ? <ForgotPasswordPage /> : <Navigate to={routes.DASHBOARD} replace />
          }
        />
        <Route
          path={routes.RESET_PASSWORD}
          element={
            !isAuthenticated ? <ResetPasswordPage /> : <Navigate to={routes.DASHBOARD} replace />
          }
        />

        {/* Protected routes share the app shell (header + main + Outlet).
            Suspense per-route so the layout stays visible while a page chunk loads. */}
        <Route element={<App />}>
          <Route
            path={routes.DASHBOARD}
            element={
              <ProtectedRoute>
                <Suspense fallback={<FullPageSpinner />}>
                  <DashboardPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path={routes.ORDERS}
            element={
              <ProtectedRoute>
                <Suspense fallback={<FullPageSpinner />}>
                  <OrdersPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path={routes.ORDERS_CREATE}
            element={
              <ProtectedRoute>
                <Suspense fallback={<FullPageSpinner />}>
                  <CreateOrderPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path={routes.ORDER_DETAILS}
            element={
              <ProtectedRoute>
                <Suspense fallback={<FullPageSpinner />}>
                  <OrderDetailsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path={routes.NOTIFICATIONS}
            element={
              <ProtectedRoute>
                <Suspense fallback={<FullPageSpinner />}>
                  <NotificationsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path={routes.SETTINGS}
            element={
              <ProtectedRoute>
                <Suspense fallback={<FullPageSpinner />}>
                  <SettingsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path={routes.ADMIN_VEHICLES}
            element={
              <ProtectedRoute requireAdmin>
                <Suspense fallback={<FullPageSpinner />}>
                  <VehicleManagementPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path={routes.ADMIN_USERS}
            element={
              <ProtectedRoute requireAdmin>
                <Suspense fallback={<FullPageSpinner />}>
                  <UserManagementPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path={routes.ADMIN_VEHICLE_AVAILABILITY_RULES}
            element={
              <ProtectedRoute requireAdmin>
                <Suspense fallback={<FullPageSpinner />}>
                  <VehicleAvailabilityRuleManagementPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Default redirect */}
        <Route
          path={routes.INDEX}
          element={<Navigate to={isAuthenticated ? routes.DASHBOARD : routes.LOGIN} replace />}
        />

        {/* Catch all */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? routes.DASHBOARD : routes.LOGIN} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};
