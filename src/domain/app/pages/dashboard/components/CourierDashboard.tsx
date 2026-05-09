import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import {
  LocalShipping,
  Today,
  Star,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { type CourierDashboard as CourierDashboardType } from '../types';
import { ECourierStatus } from 'domain/authentication/types/courierStatus';
import { StatCard } from './StatCard';

interface CourierDashboardProps {
  data: CourierDashboardType;
}

const statusColorMap: Record<string, string> = {
  [ECourierStatus.AVAILABLE]: 'success.main',
  [ECourierStatus.UNAVAILABLE]: 'warning.main',
  [ECourierStatus.OFFLINE]: 'error.main',
};

export const CourierDashboard: React.FC<CourierDashboardProps> = ({ data }) => {
  const navigate = useNavigate();

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Top stat cards */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={3}>
        <StatCard
          title="Current Status"
          value={data.currentStatus}
          icon={<LocalShipping fontSize="inherit" />}
          color={statusColorMap[data.currentStatus] ?? 'error.main'}
        />
        <StatCard
          title="Today's Deliveries"
          value={data.todaysDeliveries}
          icon={<Today fontSize="inherit" />}
          color="info.main"
        />
        <StatCard
          title="Average Rating"
          value={data.averageRating != null ? data.averageRating.toFixed(1) : 'N/A'}
          icon={<Star fontSize="inherit" />}
          color="warning.main"
        />
        <StatCard
          title="Total Completed"
          value={data.totalDeliveriesCompleted}
          icon={<CheckCircle fontSize="inherit" />}
          color="success.main"
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
