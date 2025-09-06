import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Link,
} from '@mui/material';
import { PersonAddOutlined, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AddressAutocomplete } from '../../../shared/components/AddressAutocomplete';
import { axiosClient } from '../../../api/axiosClient';

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  contactPhone: string;
  address: string;
  addressId: string;
}

interface AddressOption {
  id: string;
  addressLine1: string;
  addressLine2: string;
  postCodeInfo: {
    postcode: string;
    town: string;
    longitude: number;
    latitude: number;
  };
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    contactPhone: '',
    address: '',
    addressId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.address) {
      errors.address = 'Address is required';
    }

    if (!formData.addressId) {
      errors.address = 'Please select an address from the dropdown';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    if (error) setError(null);
  };

  const handleAddressChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: value,
      // Clear addressId when address text changes manually
      addressId: prev.address === value ? prev.addressId : '',
    }));
    
    if (fieldErrors.address) {
      setFieldErrors(prev => ({ ...prev, address: '' }));
    }
    
    if (error) setError(null);
  };

  const handleAddressSelect = (address: AddressOption) => {
    setFormData(prev => ({
      ...prev,
      addressId: address.id,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestData = {
        email: formData.email,
        password: formData.password,
        addressId: formData.addressId,
        contactPhone: formData.contactPhone || null,
      };

      await axiosClient.post('/api/identity/register/customer', requestData);
      
      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
        >
          <Card sx={{ width: '100%', maxWidth: 400 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <PersonAddOutlined sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom color="success.main">
                Registration Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Your customer account has been created successfully. You will be redirected to the login page shortly.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting in 3 seconds...
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Go to Login Now
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Card sx={{ width: '100%', maxWidth: 450 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/login')}
                variant="text"
                sx={{ mr: 2 }}
              >
                Back to Login
              </Button>
            </Box>

            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <PersonAddOutlined sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Register as a customer to access our delivery services
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                required
                disabled={isLoading}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                margin="normal"
                required
                disabled={isLoading}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                margin="normal"
                required
                disabled={isLoading}
                error={!!fieldErrors.confirmPassword}
                helperText={fieldErrors.confirmPassword}
              />
              <TextField
                fullWidth
                label="Contact Phone (Optional)"
                type="tel"
                value={formData.contactPhone}
                onChange={handleInputChange('contactPhone')}
                margin="normal"
                disabled={isLoading}
                placeholder="+1234567890"
              />
              <Box sx={{ mt: 2, mb: 2 }}>
                <AddressAutocomplete
                  label="Address"
                  value={formData.address}
                  onChange={handleAddressChange}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Start typing your address..."
                  required
                  error={!!fieldErrors.address}
                  helperText={fieldErrors.address}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Create Account'
                )}
              </Button>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate('/login')}
                    sx={{ cursor: 'pointer' }}
                  >
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};