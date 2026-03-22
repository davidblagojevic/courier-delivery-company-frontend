import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  ShoppingCart,
  People,
  LocalShipping,
  DirectionsCar,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AdminDashboard as AdminDashboardType } from '../types';
import { StatCard } from './StatCard';

interface AdminDashboardProps {
  data: AdminDashboardType;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const navigate = useNavigate();

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Top stat cards */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={3}>
        <StatCard
          title="Total Orders"
          value={data.orderCounts.total}
          icon={<ShoppingCart fontSize="inherit" />}
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Total Users"
          value={data.userCounts.total}
          icon={<People fontSize="inherit" />}
          subtitle={`${data.userCounts.customers} customers, ${data.userCounts.couriers} couriers, ${data.userCounts.admins} admins`}
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Available Couriers"
          value={data.courierAvailability.available}
          icon={<LocalShipping fontSize="inherit" />}
          color="success.main"
          subtitle={`${data.courierAvailability.unavailable} unavailable, ${data.courierAvailability.offline} offline`}
          onClick={() => navigate('/admin/users?role=Courier')}
        />
        <StatCard
          title="Vehicles"
          value={data.vehicleSummary.total}
          icon={<DirectionsCar fontSize="inherit" />}
          subtitle={`${data.vehicleSummary.zeroEmissionCount} zero-emission`}
          onClick={() => navigate('/admin/vehicles')}
        />
      </Box>

      {/* Orders by status */}
      <Typography variant="h6">Orders</Typography>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }} gap={3}>
        <StatCard
          title="Created"
          value={data.orderCounts.created}
          color="info.main"
          onClick={() => navigate('/orders?search=Created')}
        />
        <StatCard
          title="Assigned"
          value={data.orderCounts.assignedToCourier}
          color="warning.main"
          onClick={() => navigate('/orders?search=AssignedToCourier')}
        />
        <StatCard
          title="Delivered"
          value={data.orderCounts.delivered}
          color="success.main"
          onClick={() => navigate('/orders?search=Delivered')}
        />
        <StatCard
          title="Completed"
          value={data.orderCounts.completed}
          color="success.dark"
          onClick={() => navigate('/orders?search=Completed')}
        />
      </Box>
    </Box>
  );
};
