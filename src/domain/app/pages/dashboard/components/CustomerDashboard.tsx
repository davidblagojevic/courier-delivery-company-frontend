import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  ShoppingCart,
  AttachMoney,
  RateReview,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CustomerDashboard as CustomerDashboardType } from '../types';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../../../../shared/utils/currency';

interface CustomerDashboardProps {
  data: CustomerDashboardType;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ data }) => {
  const navigate = useNavigate();

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Top stat cards */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} gap={3}>
        <StatCard
          title="Total Orders"
          value={data.orderCounts.total}
          icon={<ShoppingCart fontSize="inherit" />}
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(data.totalAmountSpent)}
          icon={<AttachMoney fontSize="inherit" />}
          color="success.main"
        />
        <StatCard
          title="Awaiting Feedback"
          value={data.ordersAwaitingFeedback}
          icon={<RateReview fontSize="inherit" />}
          color={data.ordersAwaitingFeedback > 0 ? 'warning.main' : 'text.secondary'}
          onClick={() => navigate('/orders?search=Completed')}
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
