import { Box, CircularProgress } from '@mui/material';

export const FullPageSpinner = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      width: '100%',
    }}
  >
    <CircularProgress />
  </Box>
);
