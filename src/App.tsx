import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Typography, Card, CardContent } from '@mui/material';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h3" component="h1" gutterBottom>
              Courier Delivery Company
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Material-UI is working! Ready for development.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  )
}

export default App