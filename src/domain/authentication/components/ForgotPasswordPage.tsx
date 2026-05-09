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
import { PasswordOutlined, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { unauthorizedApi, getErrorMessage } from 'api';
import { routes } from 'router';

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (field: keyof ForgotPasswordFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await unauthorizedApi.post('/api/auth/forgot-password', {
        email: formData.email,
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'An error occurred. Please try again.'));
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
                <PasswordOutlined sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom>
                  Check Your Email
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  If an account with that email exists, we&apos;ve sent you a password reset link.
                </Typography>
              </Box>

              <Alert severity="success" sx={{ mb: 3 }}>
                Please check your email inbox and follow the instructions to reset your password.
              </Alert>

              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setIsSuccess(false)}
                  disabled={isLoading}
                >
                  Try Another Email
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(routes.LOGIN)}
                  startIcon={<ArrowBack />}
                  disabled={isLoading}
                >
                  Back to Login
                </Button>
              </Box>
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
              <PasswordOutlined sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Forgot Password
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Enter your email address and we&apos;ll send you a link to reset your password
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
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                required
                disabled={isLoading}
                helperText="Enter the email address associated with your account"
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !formData.email}
                sx={{ mt: 3, mb: 2 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Remember your password?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate(routes.LOGIN)}
                    sx={{ cursor: 'pointer' }}
                    disabled={isLoading}
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