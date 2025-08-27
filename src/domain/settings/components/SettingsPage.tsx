import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { 
  Person,
  Email,
  Phone,
  Work,
  Save,
  AccountCircle,
  LocalShipping,
} from '@mui/icons-material';
import { useAuth } from '../../authentication';
import { UserRole } from '../../authentication/types/userRoles';
import { ECourierStatus, courierStatusLabels, getCourierStatusColor, courierStatusToBackendValue, courierStatusFromBackendValue } from '../../authentication/types/courierStatus';
import { axiosClient } from '../../../api/axiosClient';

interface ProfileData {
  id: string;
  userName: string;
  email: string;
  role: string;
  contactPhone?: string;
  workTitle?: string;
  courierStatus?: string;
  emailConfirmed: boolean;
  isActive: boolean;
}

export const SettingsPage: React.FC = () => {
  const { token, userInfo } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    contactPhone: '',
    workTitle: '',
    courierStatus: ECourierStatus.OFFLINE,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userInfo?.id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axiosClient.get('/api/identity/me');
        const profileData = response.data;
        console.log('Profile data from /api/identity/me:', profileData);
        
        // Map the LoggedInUserResponse to our ProfileData interface
        // Convert backend integer courier status to frontend enum value
        const backendCourierStatus = profileData.courierStatus;
        const frontendCourierStatus = backendCourierStatus !== null && backendCourierStatus !== undefined 
          ? courierStatusFromBackendValue[backendCourierStatus as keyof typeof courierStatusFromBackendValue] || ECourierStatus.OFFLINE
          : ECourierStatus.OFFLINE;

        console.log('Backend courier status:', backendCourierStatus, '-> Frontend:', frontendCourierStatus);

        const mappedProfile: ProfileData = {
          id: profileData.id,
          userName: profileData.userName,
          email: profileData.email,
          role: profileData.roles?.[0] || 'Customer',
          emailConfirmed: profileData.emailConfirmed || false,
          isActive: profileData.isActive !== false,
          contactPhone: profileData.contactPhone || '',
          workTitle: profileData.workTitle || '',
          courierStatus: frontendCourierStatus,
        };
        
        setProfile(mappedProfile);
        setFormData({
          contactPhone: mappedProfile.contactPhone ?? '',
          workTitle: mappedProfile.workTitle ?? '',
          courierStatus: frontendCourierStatus,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userInfo?.id]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Handle user profile updates (phone, work title) using the new endpoint
      await axiosClient.put('/api/identity/me', {
        contactPhone: profile.role !== UserRole.ADMINISTRATOR ? formData.contactPhone || null : null,
        workTitle: profile.role === UserRole.ADMINISTRATOR ? formData.workTitle || null : null
      });

      // Handle courier status update separately
      if (profile.role === UserRole.COURIER) {
        // Convert the enum value to backend integer value
        const statusValue = courierStatusToBackendValue[formData.courierStatus];
        console.log('Sending courier status:', formData.courierStatus, '-> integer:', statusValue);
        await axiosClient.put('/api/couriers/status', {
          status: statusValue
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Update local profile state
      setProfile(prev => prev ? {
        ...prev,
        contactPhone: profile.role !== UserRole.ADMINISTRATOR ? formData.contactPhone : prev.contactPhone,
        workTitle: profile.role === UserRole.ADMINISTRATOR ? formData.workTitle : prev.workTitle,
        courierStatus: profile.role === UserRole.COURIER ? formData.courierStatus : prev.courierStatus,
      } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.ADMINISTRATOR:
        return theme.palette.error.main;
      case UserRole.COURIER:
        return theme.palette.info.main;
      case UserRole.CUSTOMER:
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  if (!token || !userInfo) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3, maxWidth: 800, mx: 'auto' }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1"
        sx={{ 
          fontSize: isMobile ? '1.5rem' : '2.125rem',
          mb: 3
        }}
      >
        Profile Settings
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Profile updated successfully!
        </Alert>
      )}

      {profile && !loading && (
        <Stack spacing={3}>
          {/* Profile Overview */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar 
                  sx={{ 
                    width: 64, 
                    height: 64,
                    bgcolor: getRoleColor(profile.role),
                  }}
                >
                  <AccountCircle sx={{ fontSize: 40 }} />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" gutterBottom>
                    {profile.userName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {profile.email}
                  </Typography>
                  <Box 
                    sx={{ 
                      px: 1.5, 
                      py: 0.5, 
                      backgroundColor: getRoleColor(profile.role),
                      color: 'white',
                      borderRadius: 1,
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 'medium'
                    }}
                  >
                    {profile.role}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Email Status: {profile.emailConfirmed ? 'Verified' : 'Not Verified'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Account Status: {profile.isActive ? 'Active' : 'Locked'}
                  </Typography>
                </Box>
                {profile.role === UserRole.COURIER && profile.courierStatus && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocalShipping fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Courier Status: 
                    </Typography>
                    <Chip 
                      label={courierStatusLabels[profile.courierStatus as ECourierStatus]} 
                      color={getCourierStatusColor(profile.courierStatus as ECourierStatus) as any}
                      size="small"
                    />
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Editable Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {profile.role === UserRole.ADMINISTRATOR ? 'Work Information' : 'Contact Information'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {profile.role === UserRole.ADMINISTRATOR 
                  ? 'Update your work details below.'
                  : 'Update your contact details below.'
                }
              </Typography>

              <Stack spacing={2}>
                {profile.role !== UserRole.ADMINISTRATOR && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Phone fontSize="small" color="action" />
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="Enter your phone number"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Box>
                )}

                {profile.role === UserRole.ADMINISTRATOR && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Work fontSize="small" color="action" />
                    <TextField
                      fullWidth
                      label="Work Title"
                      value={formData.workTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, workTitle: e.target.value }))}
                      placeholder="Enter your work title"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Box>
                )}

                {profile.role === UserRole.COURIER && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocalShipping fontSize="small" color="action" />
                    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                      <InputLabel>Courier Status</InputLabel>
                      <Select
                        value={formData.courierStatus}
                        onChange={(e) => setFormData(prev => ({ ...prev, courierStatus: e.target.value as ECourierStatus }))}
                        label="Courier Status"
                      >
                        {Object.values(ECourierStatus).map((status) => (
                          <MenuItem key={status} value={status}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={courierStatusLabels[status]} 
                                color={getCourierStatusColor(status) as any}
                                size="small"
                              />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                <Box pt={2}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving}
                    size={isMobile ? "small" : "medium"}
                  >
                    {saving ? <CircularProgress size={20} /> : 'Save Changes'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

        </Stack>
      )}
    </Box>
  );
};