import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, isAdmin } from 'domain/authentication';
import { Alert, Box } from '@mui/material';
import * as routes from './routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirect?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  redirect = routes.LOGIN,
}) => {
  const { isAuthenticated, isLoading, userInfo } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirect} replace />;
  }

  if (requireAdmin && !isAdmin(userInfo?.roles)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Administrator privileges required to view this page.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};
