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
  useTheme,
  useMediaQuery,
  Stack,
  Collapse,
} from '@mui/material';
import { Search, Refresh, FilterList, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useAuth } from '../../authentication';
import { axiosClient } from '../../../api/axiosClient';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [orders, setOrders] = useState<PagedOrdersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('orderDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);

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
              {getRoleBasedTitle()}
            </Typography>
            <Button
              variant="outlined"
              startIcon={!isMobile ? <Refresh /> : undefined}
              onClick={fetchOrders}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
            >
              {isMobile ? <Refresh /> : 'Refresh'}
            </Button>
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
                size={isMobile ? "small" : "medium"}
              />

              <Box display="flex" gap={2} flexWrap="wrap">
                <FormControl sx={{ minWidth: isMobile ? '100%' : 150, flex: isMobile ? 1 : 'none' }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortColumn}
                    label="Sort by"
                    onChange={(e) => setSortColumn(e.target.value)}
                    size={isMobile ? "small" : "medium"}
                  >
                    <MenuItem value="orderDate">Order Date</MenuItem>
                    <MenuItem value="deliveryDate">Delivery Date</MenuItem>
                    <MenuItem value="orderStatus">Status</MenuItem>
                    <MenuItem value="totalPrice">Price</MenuItem>
                    {isAdmin && <MenuItem value="customerId">Customer</MenuItem>}
                    {isAdmin && <MenuItem value="courierId">Courier</MenuItem>}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: isMobile ? '100%' : 100, flex: isMobile ? 1 : 'none' }}>
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Order"
                    onChange={(e) => setSortOrder(e.target.value)}
                    size={isMobile ? "small" : "medium"}
                  >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
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

          {orders && !loading && (
            <>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxWidth: '100%',
                  overflowX: 'auto',
                  '& .MuiTable-root': {
                    minWidth: isMobile ? 800 : 'auto',
                  },
                }}
              >
                <Table size={isMobile ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 200 }}>Order ID</TableCell>
                      <TableCell 
                        onClick={() => handleSort('orderStatus')} 
                        sx={{ cursor: 'pointer', minWidth: isMobile ? 80 : 100 }}
                      >
                        Status
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('totalPrice')} 
                        sx={{ cursor: 'pointer', minWidth: isMobile ? 70 : 80 }}
                      >
                        Price
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('orderDate')} 
                        sx={{ cursor: 'pointer', minWidth: isMobile ? 100 : 120 }}
                      >
                        Order Date
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('deliveryDate')} 
                        sx={{ cursor: 'pointer', minWidth: isMobile ? 100 : 120 }}
                      >
                        Delivery Date
                      </TableCell>
                      {isAdmin && <TableCell sx={{ minWidth: 200 }}>Customer ID</TableCell>}
                      {(isAdmin || isCourier) && <TableCell sx={{ minWidth: 200 }}>Courier ID</TableCell>}
                      <TableCell sx={{ minWidth: isMobile ? 120 : 150 }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.items.map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Typography 
                            variant={isMobile ? "caption" : "body2"} 
                            sx={{ 
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                              fontSize: isMobile ? '0.7rem' : '0.875rem'
                            }}
                          >
                            {order.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.orderStatus}
                            color={getStatusColor(order.orderStatus) as any}
                            size="small"
                            sx={{ 
                              fontSize: isMobile ? '0.65rem' : '0.75rem',
                              height: isMobile ? 20 : 24,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant={isMobile ? "caption" : "body2"}>
                            ${order.totalPrice.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant={isMobile ? "caption" : "body2"}>
                            {new Date(order.orderDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: isMobile ? '2-digit' : 'numeric'
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant={isMobile ? "caption" : "body2"}>
                            {new Date(order.deliveryDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: isMobile ? '2-digit' : 'numeric'
                            })}
                          </Typography>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Typography 
                              variant={isMobile ? "caption" : "body2"} 
                              sx={{ 
                                fontFamily: 'monospace',
                                wordBreak: 'break-all',
                                fontSize: isMobile ? '0.7rem' : '0.875rem'
                              }}
                            >
                              {order.customerId}
                            </Typography>
                          </TableCell>
                        )}
                        {(isAdmin || isCourier) && (
                          <TableCell>
                            {order.courierId ? (
                              <Typography 
                                variant={isMobile ? "caption" : "body2"} 
                                sx={{ 
                                  fontFamily: 'monospace',
                                  wordBreak: 'break-all',
                                  fontSize: isMobile ? '0.7rem' : '0.875rem'
                                }}
                              >
                                {order.courierId}
                              </Typography>
                            ) : (
                              <Typography 
                                variant={isMobile ? "caption" : "body2"} 
                                color="text.secondary"
                              >
                                Unassigned
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography 
                            variant={isMobile ? "caption" : "body2"}
                            sx={{
                              maxWidth: isMobile ? 120 : 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {order.description || (
                              <span style={{ color: theme.palette.text.secondary }}>
                                No description
                              </span>
                            )}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25, 50]}
                component="div"
                count={orders.totalCount}
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
                  Showing {orders.items.length} of {orders.totalCount} orders
                </Typography>
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="text.secondary"
                  textAlign={isMobile ? 'center' : 'right'}
                >
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