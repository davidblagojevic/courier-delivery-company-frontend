import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,
  Alert,
  Backdrop,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Person,
  AssignmentInd,
  Close,
  ExpandMore,
} from '@mui/icons-material';
import { axiosClient } from '../../api/axiosClient';

interface AvailableCourier {
  id: string;
  userName: string;
  email: string;
  currentWorkload: number;
}

interface AssignOrderToCourierProps {
  orderId: string;
  estimatedDeliveryDate: string;
  onAssignmentComplete: () => void;
  onCancel: () => void;
}

export const AssignOrderToCourier: React.FC<AssignOrderToCourierProps> = ({
  orderId,
  estimatedDeliveryDate,
  onAssignmentComplete,
  onCancel,
}) => {
  const [couriers, setCouriers] = useState<AvailableCourier[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Check if order can be assigned (estimated delivery date is today)
  const canAssignOrder = () => {
    const today = new Date();
    const deliveryDate = new Date(estimatedDeliveryDate);
    return today.toDateString() === deliveryDate.toDateString();
  };

  const fetchCouriers = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosClient.get(`/api/couriers/available`, {
        params: { page: pageNum, pageSize: 10 }
      });
      
      const newCouriers = response.data;
      
      if (append) {
        setCouriers(prev => [...prev, ...newCouriers]);
      } else {
        setCouriers(newCouriers);
      }
      
      // If we got less than pageSize items, we've reached the end
      setHasMore(newCouriers.length === 10);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available couriers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAssignOrder()) {
      fetchCouriers();
    }
  }, []);

  const handleShowMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCouriers(nextPage, true);
  };

  const handleAssign = async () => {
    if (!selectedCourierId) return;

    setAssigning(true);
    setError(null);

    try {
      await axiosClient.post(`/api/orders/${orderId}/assign?courierId=${selectedCourierId}`);
      
      onAssignmentComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign courier to order');
    } finally {
      setAssigning(false);
    }
  };

  if (!canAssignOrder()) {
    return (
      <Backdrop open sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal }}>
        <Card sx={{ maxWidth: 400, m: 2 }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Orders can only be assigned on their estimated delivery date
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Estimated delivery date: {new Date(estimatedDeliveryDate).toLocaleDateString()}
            </Typography>
            <Button variant="outlined" onClick={onCancel}>
              Close
            </Button>
          </CardContent>
        </Card>
      </Backdrop>
    );
  }

  return (
    <Backdrop open sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal }}>
      <Card 
        sx={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentInd />
              Assign Courier to Order
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Close />}
              onClick={onCancel}
            >
              Cancel
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Select an available courier to assign to this order
          </Typography>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ m: 2, mb: 0 }}>
            {error}
          </Alert>
        )}

        {/* Courier List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading && couriers.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : couriers.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No available couriers found
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {couriers.map((courier, index) => (
                <React.Fragment key={courier.id}>
                  <ListItemButton
                    selected={selectedCourierId === courier.id}
                    onClick={() => setSelectedCourierId(courier.id)}
                    sx={{ py: 2 }}
                  >
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {courier.userName}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${courier.currentWorkload} active orders`}
                            color={courier.currentWorkload === 0 ? 'success' : 'default'}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </Box>
                      }
                      secondary={courier.email}
                    />
                  </ListItemButton>
                  {index < couriers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              
              {/* Show More Button */}
              {hasMore && (
                <>
                  <Divider />
                  <ListItem>
                    <Button
                      fullWidth
                      variant="text"
                      onClick={handleShowMore}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={16} /> : <ExpandMore />}
                      sx={{ py: 1.5 }}
                    >
                      {loading ? 'Loading...' : 'Show More Couriers'}
                    </Button>
                  </ListItem>
                </>
              )}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleAssign}
            disabled={!selectedCourierId || assigning}
            startIcon={assigning ? <CircularProgress size={16} /> : <AssignmentInd />}
          >
            {assigning ? 'Assigning Courier...' : 'Assign Selected Courier'}
          </Button>
        </Box>
      </Card>
    </Backdrop>
  );
};