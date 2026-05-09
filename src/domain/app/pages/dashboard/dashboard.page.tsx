import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Box, CircularProgress, Alert, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useAuth, isAdmin, isCustomer, isCourier } from 'domain/authentication';
import { api } from 'api';
import { type DashboardResponse } from './types';
import { AdminDashboard, CustomerDashboard, CourierDashboard } from './components';

export const DashboardPage: React.FC = () => {
  const { token, userInfo } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<DashboardResponse>('/api/dashboard');
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (!token || !userInfo) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const getGreeting = () => {
    if (isAdmin(userInfo.roles)) return 'Administrator Dashboard';
    if (isCourier(userInfo.roles)) return 'Courier Dashboard';
    if (isCustomer(userInfo.roles)) return 'My Dashboard';
    return 'Dashboard';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{getGreeting()}</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDashboard}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !data && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {data && (
        <>
          {data.admin && <AdminDashboard data={data.admin} />}
          {data.customer && <CustomerDashboard data={data.customer} />}
          {data.courier && <CourierDashboard data={data.courier} />}
        </>
      )}
    </Box>
  );
};
