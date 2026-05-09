import React from 'react';
import { Alert, AlertTitle, Box, Button, Container } from '@mui/material';
import { log } from 'shared/log';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    log.error('Unhandled render error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Something went wrong</AlertTitle>
          {error.message || 'An unexpected error occurred while rendering this page.'}
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" onClick={this.handleReload}>
            Reload page
          </Button>
        </Box>
      </Container>
    );
  }
}
