import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { axiosClient } from '../utils/axiosClient';

interface Order {
  id: string;
  customerId: string;
  courierId?: string;
  orderStatus: string;
  totalPrice: number;
  vehicleId: string;
  orderDate: string;
  deliveryDate: string;
  description?: string;
}

interface PagedOrdersResponse {
  items: Order[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  links: Array<{
    href: string;
    rel: string;
    type: string;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'warning';
    case 'assigned':
      return 'info';
    case 'delivered':
      return 'success';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

export const OrdersPage: React.FC = () => {
  const { token, userInfo } = useAuth();
  const [orders, setOrders] = useState<PagedOrdersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('orderDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Early return if no auth data
  if (!token || !userInfo) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const isAdmin = userInfo.roles.includes('Administrator');
  const isCourier = userInfo.roles.includes('Courier');
  const isCustomer = userInfo.roles.includes('Customer');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortColumn,
        sortOrder,
        ...(searchTerm && { searchTerm }),
      });

      const response = await axiosClient.get(`/api/orders?${params}`);
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortColumn, sortOrder, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage + 1); // MUI uses 0-based indexing
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getRoleBasedTitle = () => {
    if (isAdmin) return 'All Orders (Administrator)';
    if (isCourier) return 'My Assigned Orders';
    if (isCustomer) return 'My Orders';
    return 'Orders';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              {getRoleBasedTitle()}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchOrders}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              label="Search orders"
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
              sx={{ minWidth: 300 }}
            />

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortColumn}
                label="Sort by"
                onChange={(e) => setSortColumn(e.target.value)}
              >
                <MenuItem value="orderDate">Order Date</MenuItem>
                <MenuItem value="deliveryDate">Delivery Date</MenuItem>
                <MenuItem value="orderStatus">Status</MenuItem>
                <MenuItem value="totalPrice">Price</MenuItem>
                {isAdmin && <MenuItem value="customerId">Customer</MenuItem>}
                {isAdmin && <MenuItem value="courierId">Courier</MenuItem>}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 100 }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                label="Order"
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>

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

          {orders && !loading && (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell 
                        onClick={() => handleSort('orderStatus')} 
                        sx={{ cursor: 'pointer' }}
                      >
                        Status
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('totalPrice')} 
                        sx={{ cursor: 'pointer' }}
                      >
                        Price
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('orderDate')} 
                        sx={{ cursor: 'pointer' }}
                      >
                        Order Date
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('deliveryDate')} 
                        sx={{ cursor: 'pointer' }}
                      >
                        Delivery Date
                      </TableCell>
                      {isAdmin && <TableCell>Customer ID</TableCell>}
                      {(isAdmin || isCourier) && <TableCell>Courier ID</TableCell>}
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.items.map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {order.id.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.orderStatus}
                            color={getStatusColor(order.orderStatus) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>${order.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(order.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(order.deliveryDate).toLocaleDateString()}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {order.customerId.substring(0, 8)}...
                            </Typography>
                          </TableCell>
                        )}
                        {(isAdmin || isCourier) && (
                          <TableCell>
                            {order.courierId ? (
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {order.courierId.substring(0, 8)}...
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Unassigned
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          {order.description || (
                            <Typography variant="body2" color="text.secondary">
                              No description
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={orders.totalCount}
                rowsPerPage={pageSize}
                page={page - 1} // Convert to 0-based for MUI
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />

              <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Showing {orders.items.length} of {orders.totalCount} orders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Page {orders.page} of {orders.totalPages}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};