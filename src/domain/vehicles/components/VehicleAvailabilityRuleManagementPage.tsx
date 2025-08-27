import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  OutlinedInput,
} from '@mui/material';
import { 
  Refresh, 
  Add, 
  Edit, 
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

interface VehicleAvailabilityRuleFormData {
  id?: string;
  name: string;
  availableFrom: string;
  availableTo: string;
  maximumDistanceInKm: number;
}

const formatTime = (timeSpan: string) => {
  // Convert TimeSpan format (HH:mm:ss) to HH:mm for display
  const parts = timeSpan.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
};

const timeToTimeSpan = (time: string) => {
  // Convert HH:mm to TimeSpan format (HH:mm:ss)
  return `${time}:00`;
};

const timeSpanToTime = (timeSpan: string) => {
  // Convert TimeSpan format (HH:mm:ss) to HH:mm for input
  const parts = timeSpan.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
};

export const VehicleAvailabilityRuleManagementPage: React.FC = () => {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [rules, setRules] = useState<VehicleAvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<VehicleAvailabilityRule | null>(null);
  const [formData, setFormData] = useState<VehicleAvailabilityRuleFormData>({
    name: '',
    availableFrom: '09:00',
    availableTo: '17:00',
    maximumDistanceInKm: 100,
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchRules = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get('/api/vehicle-availability-rules', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRules(response.data || []);
    } catch (err: any) {
      console.error('Error fetching vehicle availability rules:', err);
      setError(err.response?.data?.message || 'Failed to fetch vehicle availability rules');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleOpenDialog = (rule?: VehicleAvailabilityRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        id: rule.id,
        name: rule.name,
        availableFrom: timeSpanToTime(rule.availableFrom),
        availableTo: timeSpanToTime(rule.availableTo),
        maximumDistanceInKm: rule.maximumDistanceInKm,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        availableFrom: '09:00',
        availableTo: '17:00',
        maximumDistanceInKm: 100,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRule(null);
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (field: keyof VehicleAvailabilityRuleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      const submitData = {
        name: formData.name,
        availableFrom: timeToTimeSpan(formData.availableFrom),
        availableTo: timeToTimeSpan(formData.availableTo),
        maximumDistanceInKm: formData.maximumDistanceInKm,
      };

      if (editingRule) {
        // Update existing rule
        await axiosClient.put(
          `/api/vehicle-availability-rules/${editingRule.id}`,
          submitData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuccess('Vehicle availability rule updated successfully');
      } else {
        // Create new rule
        await axiosClient.post('/api/vehicle-availability-rules', submitData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Vehicle availability rule created successfully');
      }

      handleCloseDialog();
      fetchRules();
    } catch (err: any) {
      console.error('Error saving vehicle availability rule:', err);
      setError(err.response?.data?.message || 'Failed to save vehicle availability rule');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Vehicle Availability Rules
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchRules}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Rule
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Schedule />
                      <strong>Name</strong>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <strong>Available Hours</strong>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Speed />
                      <strong>Max Distance (km)</strong>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No vehicle availability rules found. Add your first rule to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {rule.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${formatTime(rule.availableFrom)} - ${formatTime(rule.availableTo)}`}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {rule.maximumDistanceInKm} km
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(rule)}
                          >
                            <Edit />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingRule ? 'Edit Vehicle Availability Rule' : 'Create Vehicle Availability Rule'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel htmlFor="rule-name">Rule Name</InputLabel>
                <OutlinedInput
                  id="rule-name"
                  label="Rule Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </FormControl>

              <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel htmlFor="available-from">Available From</InputLabel>
                  <OutlinedInput
                    id="available-from"
                    label="Available From"
                    type="time"
                    value={formData.availableFrom}
                    onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                    required
                  />
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel htmlFor="available-to">Available To</InputLabel>
                  <OutlinedInput
                    id="available-to"
                    label="Available To"
                    type="time"
                    value={formData.availableTo}
                    onChange={(e) => handleInputChange('availableTo', e.target.value)}
                    required
                  />
                </FormControl>
              </Stack>

              <FormControl fullWidth>
                <InputLabel htmlFor="max-distance">Maximum Distance (km)</InputLabel>
                <OutlinedInput
                  id="max-distance"
                  label="Maximum Distance (km)"
                  type="number"
                  value={formData.maximumDistanceInKm}
                  onChange={(e) => handleInputChange('maximumDistanceInKm', Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  required
                />
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={20} />
              ) : (
                editingRule ? 'Update' : 'Create'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};