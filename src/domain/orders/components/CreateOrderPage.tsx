import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import {
  Schedule,
  LocalShipping,
  Nature,
  AttachMoney,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../authentication';
import { axiosClient } from '../../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { AddressAutocomplete } from '../../../shared/components';

interface AvailableVehicle {
  vehicleId: string;
  name: string;
  isZeroEmission: boolean;
  vehicleImage: string | null;
  price: number;
  maxWeight: number;
}

export const CreateOrderPage: React.FC = () => {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Form state
  const [collectionAddressId, setCollectionAddressId] = useState('');
  const [deliveryAddressId, setDeliveryAddressId] = useState('');
  const [collectionAddress, setCollectionAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'now' | 'prebook'>('now');
  const [scheduledDelivery, setScheduledDelivery] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  
  // UI state
  const [availableVehicles, setAvailableVehicles] = useState<AvailableVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'vehicles'>('details');

  // Check if user is customer
  const isCustomer = userInfo?.roles.includes('Customer');

  useEffect(() => {
    if (!isCustomer) {
      navigate('/dashboard');
    }
  }, [isCustomer, navigate]);

  const handleGetAvailableVehicles = async () => {
    if (!collectionAddress || !deliveryAddress) {
      setError('Please enter both collection and delivery addresses');
      return;
    }

    if (!collectionAddressId || !deliveryAddressId) {
      setError('Please select addresses from the suggestions');
      return;
    }

    setVehiclesLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        collectionAddressId,
        deliveryAddressId,
      });

      if (deliveryType === 'prebook' && scheduledDelivery) {
        params.append('deliveryByUtc', scheduledDelivery!.toISOString());
      }

      const response = await axiosClient.get(`/api/vehicles/available?${params}`);
      setAvailableVehicles(response.data);
      setStep('vehicles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available vehicles');
    } finally {
      setVehiclesLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedVehicleId) {
      setError('Please select a vehicle');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        vehicleId: selectedVehicleId,
        collectionAddressId,
        deliveryAddressId,
        description: description || undefined,
      };

      const response = await axiosClient.post('/api/orders', orderData);
      
      // Navigate to orders page or show success message
      navigate('/orders', { 
        state: { 
          message: `Order created successfully! Order ID: ${response.data}`,
          type: 'success'
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('details');
    setSelectedVehicleId(null);
    setAvailableVehicles([]);
  };

  if (!isCustomer) {
    return (
      <Alert severity="error">
        Access denied. Only customers can create orders.
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Order
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {step === 'details' && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Details
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <AddressAutocomplete
                label="Collection Address"
                value={collectionAddress}
                onChange={setCollectionAddress}
                onAddressSelect={(address) => setCollectionAddressId(address.id)}
                placeholder="Start typing to search for an address..."
                required
              />

              <AddressAutocomplete
                label="Delivery Address"
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                onAddressSelect={(address) => setDeliveryAddressId(address.id)}
                placeholder="Start typing to search for an address..."
                required
              />

              <FormControl component="fieldset">
                <FormLabel component="legend">Delivery Time</FormLabel>
                <RadioGroup
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as 'now' | 'prebook')}
                >
                  <FormControlLabel 
                    value="now" 
                    control={<Radio />} 
                    label="Ready Now" 
                  />
                  <FormControlLabel 
                    value="prebook" 
                    control={<Radio />} 
                    label="Schedule for Later" 
                  />
                </RadioGroup>
              </FormControl>

              {deliveryType === 'prebook' && (
                <Box sx={{ maxWidth: 400 }}>
                  <DateTimePicker
                    label="Scheduled Delivery Time"
                    value={scheduledDelivery}
                    onChange={(newValue) => setScheduledDelivery(newValue)}
                    minDateTime={new Date(Date.now() + 8 * 60 * 60 * 1000)} // 8 hours from now
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: deliveryType === 'prebook',
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Schedule color="action" />
                            </InputAdornment>
                          ),
                        }
                      }
                    }}
                  />
                </Box>
              )}

              <TextField
                fullWidth
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                placeholder="Add any special instructions or item descriptions..."
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleGetAvailableVehicles}
                disabled={vehiclesLoading || !collectionAddress || !deliveryAddress || !collectionAddressId || !deliveryAddressId}
                startIcon={vehiclesLoading ? <CircularProgress size={20} /> : <LocalShipping />}
                fullWidth
              >
                {vehiclesLoading ? 'Finding Available Vehicles...' : 'Find Available Vehicles'}
              </Button>
            </Box>
          </Paper>
        )}

        {step === 'vehicles' && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button onClick={handleBack} sx={{ mr: 2 }}>
                ← Back to Details
              </Button>
              <Typography variant="h6">
                Select Vehicle
              </Typography>
            </Box>

            {availableVehicles.length === 0 ? (
              <Alert severity="info">
                No vehicles available for the selected addresses and time. Please try different options.
              </Alert>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {availableVehicles.map((vehicle) => (
                  <Box key={vehicle.vehicleId}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedVehicleId === vehicle.vehicleId ? 2 : 1,
                        borderColor: selectedVehicleId === vehicle.vehicleId ? 'primary.main' : 'divider',
                        '&:hover': { boxShadow: 3 }
                      }}
                      onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <LocalShipping sx={{ mr: 1 }} />
                          <Typography variant="h6" component="div">
                            {vehicle.name}
                          </Typography>
                          {vehicle.isZeroEmission && (
                            <Chip 
                              icon={<Nature />}
                              label="Eco-Friendly" 
                              color="success" 
                              size="small" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Max Weight: {vehicle.maxWeight} kg
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <AttachMoney />
                          <Typography variant="h6" color="primary">
                            £{vehicle.price.toFixed(2)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}

            {selectedVehicleId && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleCreateOrder}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Creating Order...' : 'Book Order'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};