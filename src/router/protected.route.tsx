import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, isAdmin } from '../domain/authentication';
import { Layout } from '../domain/app';
import { Alert, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, userInfo } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin permission if required
  if (requireAdmin && !isAdmin(userInfo?.roles)) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Access denied. Administrator privileges required to view this page.
          </Alert>
        </Box>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
};