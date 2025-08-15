import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { OrdersPage } from './components/OrdersPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AppContent: React.FC = () => {
  const { isAuthenticated, userInfo, logout } = useAuth();

  const getUserDisplayName = () => {
    if (!userInfo) return '';
    const primaryRole = userInfo.roles[0] || 'User';
    return `${userInfo.email} (${primaryRole})`;
  };

  return (
    <>
      {isAuthenticated ? (
        <>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Courier Delivery Company
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2">
                  {getUserDisplayName()}
                </Typography>
                <Button
                  color="inherit"
                  startIcon={<LogoutOutlined />}
                  onClick={logout}
                >
                  Logout
                </Button>
              </Box>
            </Toolbar>
          </AppBar>
          
          <OrdersPage />
        </>
      ) : (
        <LoginPage />
      )}
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App