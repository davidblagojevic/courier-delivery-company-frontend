import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { 
  Search, 
  Refresh, 
  Add, 
  Edit, 
  DirectionsCar,
  Schedule,
  Speed,
} from '@mui/icons-material';
import { useAuth } from '../../authentication';
import { axiosClient } from '../../../api/axiosClient';

interface VehicleAvailabilityRule {
  id: string;
  name: string;
  availableFrom: string;
  availableTo: string;
  maximumDistanceInKm: number;
}

interface Vehicle {
  id: string;
  name: string;
  maxWeight: number;
  isZeroEmission: boolean;
  vehicleImage?: string;
  pricePerKilometer: number;
  vehicleAvailabilityRule: VehicleAvailabilityRule;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  updatedDate?: string;
}

interface PagedVehiclesResponse {
  items: Vehicle[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface VehicleFormData {
  id?: string;
  name: string;
  maxWeight: number;
  isZeroEmission: boolean;
  pricePerKilometer: number;
  vehicleAvailabilityRuleId: string;
  vehicleImage?: string;
}

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
};

export const VehicleManagementPage: React.FC = () => {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [vehicles, setVehicles] = useState<PagedVehiclesResponse | null>(null);
  const [availabilityRules, setAvailabilityRules] = useState<VehicleAvailabilityRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    maxWeight: 0,
    isZeroEmission: false,
    pricePerKilometer: 0,
    vehicleAvailabilityRuleId: '',
    vehicleImage: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { searchTerm }),
      });

      const response = await axiosClient.get(`/api/vehicles?${params}`);
      setVehicles(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm]);

  const fetchAvailabilityRules = useCallback(async () => {
    try {
      const response = await axiosClient.get('/api/vehicles/availability-rules');
      setAvailabilityRules(response.data);
    } catch (err) {
      console.error('Failed to load availability rules:', err);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    fetchAvailabilityRules();
  }, [fetchAvailabilityRules]);

  const handleSearch = () => {
    setPage(1);
    fetchVehicles();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleCreateVehicle = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      maxWeight: 0,
      isZeroEmission: false,
      pricePerKilometer: 0,
      vehicleAvailabilityRuleId: '',
      vehicleImage: '',
    });
    setDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setDialogMode('edit');
    setFormData({
      id: vehicle.id,
      name: vehicle.name,
      maxWeight: vehicle.maxWeight,
      isZeroEmission: vehicle.isZeroEmission,
      pricePerKilometer: vehicle.pricePerKilometer,
      vehicleAvailabilityRuleId: vehicle.vehicleAvailabilityRule.id,
      vehicleImage: vehicle.vehicleImage || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      maxWeight: 0,
      isZeroEmission: false,
      pricePerKilometer: 0,
      vehicleAvailabilityRuleId: '',
      vehicleImage: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.vehicleAvailabilityRuleId || formData.maxWeight <= 0 || formData.pricePerKilometer <= 0) {
      setError('Please fill in all required fields with valid values');
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      if (dialogMode === 'create') {
        await axiosClient.post('/api/vehicles', {
          name: formData.name,
          maxWeight: formData.maxWeight,
          isZeroEmission: formData.isZeroEmission,
          pricePerKilometer: formData.pricePerKilometer,
          vehicleAvailabilityRuleId: formData.vehicleAvailabilityRuleId,
          vehicleImage: formData.vehicleImage || null,
        });
      } else {
        await axiosClient.put(`/api/vehicles/${formData.id}`, {
          name: formData.name,
          maxWeight: formData.maxWeight,
          isZeroEmission: formData.isZeroEmission,
          pricePerKilometer: formData.pricePerKilometer,
          vehicleImage: formData.vehicleImage || null,
        });
      }

      handleCloseDialog();
      fetchVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setFormLoading(false);
    }
  };

  if (!token) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1"
              sx={{ 
                fontSize: isMobile ? '1.5rem' : '2.125rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                pr: 1
              }}
            >
              Vehicle Management
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={!isMobile ? <Add /> : undefined}
                onClick={handleCreateVehicle}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? <Add /> : 'Add Vehicle'}
              </Button>
              <Button
                variant="outlined"
                startIcon={!isMobile ? <Refresh /> : undefined}
                onClick={fetchVehicles}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? <Refresh /> : 'Refresh'}
              </Button>
            </Stack>
          </Box>

          <Stack spacing={2} mb={3}>
            <TextField
              fullWidth
              label="Search vehicles"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} disabled={loading}>
                      <Search />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              size={isMobile ? "small" : "medium"}
            />
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}

          {vehicles && !loading && (
            <>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxWidth: '100%',
                  overflowX: 'auto',
                  '& .MuiTable-root': {
                    minWidth: isMobile ? 900 : 'auto',
                  },
                }}
              >
                <Table size={isMobile ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 150 }}>Name</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Max Weight (kg)</TableCell>
                      <TableCell sx={{ minWidth: 80 }}>Zero Emission</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Price/km</TableCell>
                      <TableCell sx={{ minWidth: 180 }}>Availability Rule</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Schedule</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Max Distance</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Created By</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.items.map((vehicle) => (
                      <TableRow key={vehicle.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <DirectionsCar color="primary" fontSize="small" />
                            <Typography variant={isMobile ? "caption" : "body2"} fontWeight="medium">
                              {vehicle.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant={isMobile ? "caption" : "body2"}>
                            {vehicle.maxWeight} kg
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={vehicle.isZeroEmission ? 'Yes' : 'No'}
                            color={vehicle.isZeroEmission ? 'success' : 'default'}
                            size="small"
                            sx={{ 
                              fontSize: isMobile ? '0.65rem' : '0.75rem',
                              height: isMobile ? 20 : 24,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant={isMobile ? "caption" : "body2"}>
                            ${vehicle.pricePerKilometer.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant={isMobile ? "caption" : "body2"} fontWeight="medium">
                            {vehicle.vehicleAvailabilityRule.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Schedule fontSize="small" color="action" />
                            <Typography variant={isMobile ? "caption" : "body2"}>
                              {formatTime(vehicle.vehicleAvailabilityRule.availableFrom)} - {formatTime(vehicle.vehicleAvailabilityRule.availableTo)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Speed fontSize="small" color="action" />
                            <Typography variant={isMobile ? "caption" : "body2"}>
                              {vehicle.vehicleAvailabilityRule.maximumDistanceInKm} km
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant={isMobile ? "caption" : "body2"} 
                            color="text.secondary"
                          >
                            {vehicle.createdBy}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditVehicle(vehicle)}
                            sx={{ color: 'primary.main' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25, 50]}
                component="div"
                count={vehicles.totalCount}
                rowsPerPage={pageSize}
                page={page - 1}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  '& .MuiTablePagination-toolbar': {
                    paddingLeft: isMobile ? 1 : 2,
                    paddingRight: isMobile ? 1 : 2,
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                  },
                }}
              />

              <Box 
                mt={2} 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center"
                flexDirection={isMobile ? 'column' : 'row'}
                gap={isMobile ? 1 : 0}
              >
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="text.secondary"
                  textAlign={isMobile ? 'center' : 'left'}
                >
                  Showing {vehicles.items.length} of {vehicles.totalCount} vehicles
                </Typography>
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="text.secondary"
                  textAlign={isMobile ? 'center' : 'right'}
                >
                  Page {vehicles.page} of {vehicles.totalPages}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Vehicle' : 'Edit Vehicle'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Vehicle Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                sx={{ flex: '1 1 200px', minWidth: 200 }}
              />
              <TextField
                label="Max Weight (kg)"
                type="number"
                value={formData.maxWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, maxWeight: parseFloat(e.target.value) || 0 }))}
                required
                inputProps={{ min: 0, step: 0.1 }}
                sx={{ flex: '1 1 150px', minWidth: 150 }}
              />
            </Box>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Price per Kilometer"
                type="number"
                value={formData.pricePerKilometer}
                onChange={(e) => setFormData(prev => ({ ...prev, pricePerKilometer: parseFloat(e.target.value) || 0 }))}
                required
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ flex: '1 1 150px', minWidth: 150 }}
              />
              <FormControl required sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <InputLabel>Availability Rule</InputLabel>
                <Select
                  value={formData.vehicleAvailabilityRuleId}
                  label="Availability Rule"
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleAvailabilityRuleId: e.target.value }))}
                >
                  {availabilityRules.map((rule) => (
                    <MenuItem key={rule.id} value={rule.id}>
                      {rule.name} ({formatTime(rule.availableFrom)} - {formatTime(rule.availableTo)}, {rule.maximumDistanceInKm}km)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Vehicle Image URL (optional)"
              value={formData.vehicleImage}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicleImage: e.target.value }))}
              placeholder="https://example.com/vehicle-image.jpg"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isZeroEmission}
                  onChange={(e) => setFormData(prev => ({ ...prev, isZeroEmission: e.target.checked }))}
                />
              }
              label="Zero Emission Vehicle"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : (dialogMode === 'create' ? 'Create' : 'Update')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};