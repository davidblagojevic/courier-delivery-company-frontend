import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Collapse,
} from '@mui/material';
import { 
  Search, 
  Refresh, 
  Edit, 
  People,
  FilterList,
  ExpandMore,
  ExpandLess,
  Phone,
  Email,
  LocationOn,
  Work,
  AdminPanelSettings,
  LocalShipping,
  Person,
  Add,
} from '@mui/icons-material';
import { useAuth } from 'domain/authentication';
import { UserRole } from 'domain/authentication/types/userRoles';
import { api } from 'api';
import {
  type User,
  type PagedUsersResponse,
  type UserFormData,
  type CreateUserFormData,
} from '../types';

const getRoleIcon = (role: string) => {
  switch (role) {
    case UserRole.ADMINISTRATOR:
      return <AdminPanelSettings fontSize="small" />;
    case UserRole.COURIER:
      return <LocalShipping fontSize="small" />;
    case UserRole.CUSTOMER:
      return <Person fontSize="small" />;
    default:
      return <People fontSize="small" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case UserRole.ADMINISTRATOR:
      return 'error';
    case UserRole.COURIER:
      return 'info';
    case UserRole.CUSTOMER:
      return 'success';
    default:
      return 'default';
  }
};

export const UserManagementPage: React.FC = () => {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState<PagedUsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({});
  const [createFormData, setCreateFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    contactPhone: '',
    workTitle: '',
    role: UserRole.COURIER
  });
  const [formLoading, setFormLoading] = useState(false);
  const [createFormLoading, setCreateFormLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { searchTerm }),
        ...(roleFilter && { role: roleFilter }),
      });

      const response = await api.get(`/api/users?${params}`);
      setUsers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      id: user.id,
      contactPhone: user.contactPhone || '',
      workTitle: user.workTitle || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({});
    setSelectedUser(null);
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    setError(null);

    try {
      await api.put(`/api/users/${selectedUser.id}`, {
        contactPhone: formData.contactPhone || null,
        workTitle: formData.workTitle || null,
      });

      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateUser = () => {
    setCreateFormData({
      email: '',
      password: '',
      contactPhone: '',
      workTitle: '',
      role: UserRole.COURIER
    });
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateFormData({
      email: '',
      password: '',
      contactPhone: '',
      workTitle: '',
      role: UserRole.COURIER
    });
  };

  const handleCreateSubmit = async () => {
    setCreateFormLoading(true);
    setError(null);

    try {
      const endpoint = createFormData.role === UserRole.ADMINISTRATOR 
        ? '/api/identity/register/administrator'
        : '/api/identity/register/courier';

      const payload = createFormData.role === UserRole.ADMINISTRATOR
        ? {
            email: createFormData.email,
            password: createFormData.password,
            workTitle: createFormData.workTitle || ''
          }
        : {
            email: createFormData.email,
            password: createFormData.password,
            contactPhone: createFormData.contactPhone || ''
          };

      await api.post(endpoint, payload);

      handleCloseCreateDialog();
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateFormLoading(false);
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
              User Management
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={!isMobile ? <Add /> : undefined}
                onClick={handleCreateUser}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? <Add /> : 'Add User'}
              </Button>
              <Button
                variant="outlined"
                startIcon={!isMobile ? <Refresh /> : undefined}
                onClick={fetchUsers}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? <Refresh /> : 'Refresh'}
              </Button>
            </Box>
          </Box>

          {/* Mobile: Collapsible filters */}
          {isMobile && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              endIcon={filtersExpanded ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              sx={{ mb: 2 }}
            >
              Filters & Search
            </Button>
          )}

          <Collapse in={filtersExpanded} timeout="auto" unmountOnExit>
            <Stack spacing={2} mb={3}>
              <TextField
                fullWidth
                label="Search users"
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

              <Box display="flex" gap={2} flexWrap="wrap">
                <FormControl sx={{ minWidth: isMobile ? '100%' : 150, flex: isMobile ? 1 : 'none' }}>
                  <InputLabel>Filter by Role</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Filter by Role"
                    onChange={(e) => setRoleFilter(e.target.value)}
                    size={isMobile ? "small" : "medium"}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value={UserRole.ADMINISTRATOR}>Administrator</MenuItem>
                    <MenuItem value={UserRole.CUSTOMER}>Customer</MenuItem>
                    <MenuItem value={UserRole.COURIER}>Courier</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Collapse>

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

          {users && !loading && (
            <>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxWidth: '100%',
                  overflowX: 'auto',
                  '& .MuiTable-root': {
                    minWidth: isMobile ? 1000 : 'auto',
                  },
                }}
              >
                <Table size={isMobile ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 200 }}>User</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Role</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Contact</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Role Details</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>Address</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.items.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant={isMobile ? "caption" : "body2"} fontWeight="medium">
                              {user.userName}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                              <Email fontSize="small" color="action" />
                              <Typography variant={isMobile ? "caption" : "caption"} color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={user.role}
                            color={getRoleColor(user.role) as any}
                            size="small"
                            sx={{ 
                              fontSize: isMobile ? '0.65rem' : '0.75rem',
                              height: isMobile ? 20 : 24,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Locked'}
                            color={user.isActive ? 'success' : 'error'}
                            size="small"
                            sx={{ 
                              fontSize: isMobile ? '0.65rem' : '0.75rem',
                              height: isMobile ? 20 : 24,
                            }}
                          />
                          {user.emailConfirmed && (
                            <Chip
                              label="Email Verified"
                              color="info"
                              size="small"
                              sx={{ 
                                fontSize: isMobile ? '0.65rem' : '0.75rem',
                                height: isMobile ? 20 : 24,
                                ml: 0.5
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.contactPhone && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant={isMobile ? "caption" : "body2"}>
                                {user.contactPhone}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.workTitle && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Work fontSize="small" color="action" />
                              <Typography variant={isMobile ? "caption" : "body2"}>
                                {user.workTitle}
                              </Typography>
                            </Box>
                          )}
                          {user.courierStatus && (
                            <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                              Status: {user.courierStatus}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.address && (
                            <Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <LocationOn fontSize="small" color="action" />
                                <Typography variant={isMobile ? "caption" : "caption"}>
                                  {user.address.addressLine1}
                                </Typography>
                              </Box>
                              <Typography variant={isMobile ? "caption" : "caption"} color="text.secondary">
                                {user.address.city}, {user.address.postCode}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUser(user)}
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
                count={users.totalCount}
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
                  Showing {users.items.length} of {users.totalCount} users
                </Typography>
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="text.secondary"
                  textAlign={isMobile ? 'center' : 'right'}
                >
                  Page {users.page} of {users.totalPages}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Edit User: {selectedUser?.userName}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Note: Role changes are not supported. Only {selectedUser?.role === 'Administrator' ? 'work titles' : 'contact information'} can be updated.
            </Alert>
            
            {selectedUser?.role !== 'Administrator' && (
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.contactPhone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="Enter phone number"
              />
            )}
            
            {selectedUser?.role === 'Administrator' && (
              <TextField
                fullWidth
                label="Work Title"
                value={formData.workTitle || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, workTitle: e.target.value }))}
                placeholder="Enter work title"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Create New User
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Create a new Administrator or Courier account. All fields marked with * are required.
            </Alert>
            
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={createFormData.role}
                label="Role"
                onChange={(e) => setCreateFormData(prev => ({ 
                  ...prev, 
                  role: e.target.value as UserRole.ADMINISTRATOR | UserRole.COURIER 
                }))}
              >
                <MenuItem value={UserRole.ADMINISTRATOR}>Administrator</MenuItem>
                <MenuItem value={UserRole.COURIER}>Courier</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              required
              label="Email"
              type="email"
              value={createFormData.email}
              onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
            />

            <TextField
              fullWidth
              required
              label="Password"
              type="password"
              value={createFormData.password}
              onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
            />
            
            {createFormData.role === UserRole.ADMINISTRATOR && (
              <TextField
                fullWidth
                label="Work Title"
                value={createFormData.workTitle || ''}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, workTitle: e.target.value }))}
                placeholder="Enter work title (optional)"
              />
            )}

            {createFormData.role === UserRole.COURIER && (
              <TextField
                fullWidth
                label="Contact Phone"
                value={createFormData.contactPhone || ''}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="Enter phone number (optional)"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateSubmit} 
            variant="contained" 
            disabled={createFormLoading || !createFormData.email || !createFormData.password}
          >
            {createFormLoading ? <CircularProgress size={20} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};