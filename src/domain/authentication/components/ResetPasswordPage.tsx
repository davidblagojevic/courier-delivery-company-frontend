import React, { useState, useEffect } from 'react';
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
  IconButton,
  InputAdornment,
} from '@mui/material';
import { LockReset, ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../../api/apiClient';

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const handleInputChange = (field: keyof ResetPasswordFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (error) setError(null);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/auth/reset-password', {
        email: email,
        token: token,
        newPassword: formData.newPassword,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <LockReset sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom>
                  Password Reset
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Your password has been successfully reset!
                </Typography>
              </Box>

              <Alert severity="success" sx={{ mb: 3 }}>
                You can now log in with your new password.
              </Alert>

              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login')}
                size="large"
              >
                Continue to Login
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
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <LockReset sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Enter your new password below
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
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleInputChange('newPassword')}
                margin="normal"
                required
                disabled={isLoading}
                autoFocus
                helperText="Must be at least 8 characters with uppercase, lowercase, and number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                margin="normal"
                required
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !formData.newPassword || !formData.confirmPassword || !token || !email}
                sx={{ mt: 3, mb: 2 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Reset Password'
                )}
              </Button>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate('/login')}
                    sx={{ cursor: 'pointer' }}
                    disabled={isLoading}
                    startIcon={<ArrowBack />}
                  >
                    Back to Login
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