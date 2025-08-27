import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Divider,
  Container,
  Stack,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  LocalShipping,
  Schedule,
  CheckCircle,
  Nature,
  Person,
  Description as DescriptionIcon,
  RateReview,
} from '@mui/icons-material';
import { axiosClient } from '../../../api/axiosClient';
import { useAuth, isAdmin, isCustomer, isCourier } from '../../authentication';
import { AssignOrderToCourier } from '../../../shared/components';
import { formatCurrency, formatPricePerUnit } from '../../../shared/utils';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackDisplay } from './FeedbackDisplay';
import { ordersApi } from '../api';
import { 
  OrderDetails, 
  CreateFeedbackRequest, 
  AddressInfo,
  getStatusColor,
  canAssignCourier as checkCanAssignCourier,
  canMarkAsDelivered as checkCanMarkAsDelivered,
  canMarkAsCompleted as checkCanMarkAsCompleted,
  canAddFeedback as checkCanAddFeedback
} from '../types';


const formatAddress = (address: AddressInfo) => {
  const line2 = address.addressLine2 ? `, ${address.addressLine2}` : '';
  return `${address.addressLine1}${line2}, ${address.town}, ${address.postCode}`;
};

export const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAssignCourier, setShowAssignCourier] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [markingCompleted, setMarkingCompleted] = useState(false);

  // Check if we came from order creation
  useEffect(() => {
    if (location.state?.orderCreated) {
      setShowSuccessMessage(true);
      // Clear the state to prevent showing the message again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosClient.get(`/api/orders/${orderId}`);
        setOrder(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleAssignmentComplete = () => {
    setShowAssignCourier(false);
    // Refresh order data to show updated status
    if (orderId) {
      const fetchOrderDetails = async () => {
        try {
          const response = await axiosClient.get(`/api/orders/${orderId}`);
          setOrder(response.data);
        } catch (err) {

        }
      };
      fetchOrderDetails();
    }
  };

  // Check if user can assign couriers (is admin and order is created status)
  const canAssignCourier = () => {
    return isAdmin(userInfo?.roles) && 
           order && checkCanAssignCourier(order.orderStatus);
  };

  // Check if courier can mark order as delivered
  const canMarkAsDelivered = () => {
    return isCourier(userInfo?.roles) && 
           order && checkCanMarkAsDelivered(order.orderStatus) &&
           order.courierId === userInfo?.id;
  };

  // Check if customer can mark order as completed
  const canMarkAsCompleted = () => {
    return isCustomer(userInfo?.roles) && 
           order && checkCanMarkAsCompleted(order.orderStatus) &&
           order.customerId === userInfo?.id;
  };

  // Check if customer can add feedback
  const canAddFeedback = () => {
    return isCustomer(userInfo?.roles) && 
           order && checkCanAddFeedback(order.orderStatus) &&
           order.customerId === userInfo?.id &&
           !order.feedback;
  };

  // Check if user can view feedback
  const canViewFeedback = () => {
    return order?.feedback && (
      isAdmin(userInfo?.roles) ||
      order?.customerId === userInfo?.id ||
      order?.courierId === userInfo?.id
    );
  };

  const handleMarkAsDelivered = async () => {
    if (!order) return;

    setMarkingDelivered(true);
    setError(null);

    try {
      await axiosClient.post(`/api/orders/${order.id}/delivered`);
      
      const response = await axiosClient.get(`/api/orders/${order.id}`);
      setOrder(response.data);
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark order as delivered');
    } finally {
      setMarkingDelivered(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!order) return;

    setMarkingCompleted(true);
    setError(null);

    try {
      await ordersApi.markAsCompleted(order.id);
      
      const response = await axiosClient.get(`/api/orders/${order.id}`);
      setOrder(response.data);
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark order as completed');
    } finally {
      setMarkingCompleted(false);
    }
  };

  const handleFeedbackSubmit = async (feedback: CreateFeedbackRequest) => {
    if (!order) return;

    await ordersApi.addFeedback(order.id, feedback);
    
    // Refresh order data to show the new feedback
    const response = await axiosClient.get(`/api/orders/${order.id}`);
    setOrder(response.data);
    
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Order not found</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Success Message */}
      {showSuccessMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setShowSuccessMessage(false)}
        >
          Order created successfully! Your order has been submitted and is being processed.
        </Alert>
      )}

      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/orders')}
          sx={{ borderRadius: 2 }}
        >
          Back to Orders
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Order Details
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          label={order.orderStatus}
          color={getStatusColor(order.orderStatus) as any}
          sx={{ 
            fontWeight: 600,
            fontSize: '0.875rem',
            height: 36,
            px: 2
          }}
        />
      </Stack>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left Column - Order Summary and Addresses */}
        <Box sx={{ flex: { xs: 1, lg: '2 1 0%' } }}>
          <Stack spacing={3}>
            {/* Order Summary */}
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: 'grey.100',
                  p: 3,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  Order Summary
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Complete details about your order
                </Typography>
              </Box>
              
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3
                }}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Order ID
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        wordBreak: 'break-all',
                        fontWeight: 500
                      }}
                    >
                      {order.id}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Total Price
                    </Typography>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                      {formatCurrency(order.totalPrice)}
                    </Typography>
                  </Box>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule color="action" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Order Date
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(order.orderDate).toLocaleString()}
                    </Typography>
                  </Stack>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule color="warning" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Estimated Delivery
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(order.estimatedDeliveryDate).toLocaleString()}
                    </Typography>
                  </Stack>

                  {order.actualDeliveryDate && (
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle color="success" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          Actual Delivery
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.main' }}>
                        {new Date(order.actualDeliveryDate).toLocaleString()}
                      </Typography>
                    </Stack>
                  )}

                  {order.courierId && (
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          Courier ID
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {order.courierId}
                      </Typography>
                    </Stack>
                  )}
                </Box>

                {order.description && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DescriptionIcon color="info" fontSize="small" />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Description
                        </Typography>
                      </Box>
                      <Typography variant="body1">{order.description}</Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Addresses */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3
            }}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'primary.200',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ p: 3, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <LocationOn fontSize="small" />
                    </Avatar>
                    Collection Address
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    {formatAddress(order.collectionAddress)}
                  </Typography>
                </CardContent>
              </Card>
              
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'success.200',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ p: 3, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                      <LocationOn fontSize="small" />
                    </Avatar>
                    Delivery Address
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    {formatAddress(order.deliveryAddress)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Box>

        {/* Right Column - Vehicle Information */}
        <Box sx={{ flex: { xs: 1, lg: '1 1 0%' } }}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
              height: 'fit-content'
            }}
          >
            <Box 
              sx={{ 
                bgcolor: 'grey.100',
                p: 3,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping />
                Vehicle Information
              </Typography>
            </Box>
            
            <CardContent sx={{ p: 3 }}>
              {order.vehicle.vehicleImage && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={order.vehicle.vehicleImage}
                    alt={order.vehicle.name}
                    style={{
                      width: '100%',
                      maxWidth: '280px',
                      height: '180px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </Box>
              )}
              
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {order.vehicle.name}
                {order.vehicle.isZeroEmission && (
                  <Chip 
                    icon={<Nature />}
                    label="Eco-Friendly" 
                    color="success" 
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Max Weight Capacity
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {order.vehicle.maxWeight} kg
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Price per Kilometer
                  </Typography>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                    {formatPricePerUnit(order.vehicle.pricePerKilometer, 'km')}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Feedback Section */}
      {canViewFeedback() && order?.feedback && (
        <Box sx={{ mt: 4 }}>
          <FeedbackDisplay feedback={order.feedback} />
        </Box>
      )}

      {/* Action Buttons */}
      {(canAssignCourier() || canMarkAsDelivered() || canMarkAsCompleted() || canAddFeedback()) && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Assign Courier Button for Admins */}
          {canAssignCourier() && (
            <Button
              variant="contained"
              size="large"
              startIcon={<Person />}
              onClick={() => setShowAssignCourier(true)}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 3,
              }}
            >
              Assign Courier
            </Button>
          )}

          {/* Mark as Delivered Button for Couriers */}
          {canMarkAsDelivered() && (
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={markingDelivered ? <CircularProgress size={16} /> : <LocalShipping />}
              onClick={handleMarkAsDelivered}
              disabled={markingDelivered}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 3,
              }}
            >
              {markingDelivered ? 'Marking as Delivered...' : 'Mark as Delivered'}
            </Button>
          )}

          {/* Mark as Completed Button for Customers */}
          {canMarkAsCompleted() && (
            <Button
              variant="contained"
              color="info"
              size="large"
              startIcon={markingCompleted ? <CircularProgress size={16} /> : <CheckCircle />}
              onClick={handleMarkAsCompleted}
              disabled={markingCompleted}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 3,
              }}
            >
              {markingCompleted ? 'Marking as Completed...' : 'Mark as Completed'}
            </Button>
          )}

          {/* Add Feedback Button for Customers */}
          {canAddFeedback() && (
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<RateReview />}
              onClick={() => setShowFeedbackForm(true)}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 3,
              }}
            >
              Add Feedback
            </Button>
          )}
        </Box>
      )}

      {/* Assign Courier Modal */}
      {showAssignCourier && order && (
        <AssignOrderToCourier
          orderId={order.id}
          estimatedDeliveryDate={order.estimatedDeliveryDate}
          onAssignmentComplete={handleAssignmentComplete}
          onCancel={() => setShowAssignCourier(false)}
        />
      )}

      {/* Feedback Form Modal */}
      {showFeedbackForm && order && (
        <FeedbackForm
          orderId={order.id}
          open={showFeedbackForm}
          onClose={() => setShowFeedbackForm(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </Container>
  );
};