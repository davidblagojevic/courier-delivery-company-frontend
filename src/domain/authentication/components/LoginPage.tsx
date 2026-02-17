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
} from '@mui/material';
import { LoginOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginCredentials {
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, [clearError]);

  const handleInputChange = (field: keyof LoginCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (error) clearError();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!credentials.email || !credentials.password) {
      return;
    }

    try {
      await login(credentials.email, credentials.password);
    } catch (err) {
      // Error is handled by the context
    }
  };

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
              <LoginOutlined sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Login
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Enter your credentials to access the courier system
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
                value={credentials.email}
                onChange={handleInputChange('email')}
                margin="normal"
                required
                disabled={isLoading}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={credentials.password}
                onChange={handleInputChange('password')}
                margin="normal"
                required
                disabled={isLoading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !credentials.email || !credentials.password}
                sx={{ mt: 3, mb: 2 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Login'
                )}
              </Button>

              <Box textAlign="center" mt={2} display="flex" flexDirection="column" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    sx={{ cursor: 'pointer', textDecoration: 'none' }}
                    disabled={isLoading}
                  >
                    Forgot your password?
                  </Link>
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate('/register')}
                    sx={{ cursor: 'pointer' }}
                    disabled={isLoading}
                  >
                    Register here
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