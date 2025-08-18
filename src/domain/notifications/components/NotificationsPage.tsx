import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as UnreadIcon,
  CheckCircleOutline as ReadIcon,
  MarkEmailRead as MarkReadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationsContext';
import { Notification } from '../services/notificationsApi';
import { formatDistanceToNow, format } from 'date-fns';

type NotificationFilter = 'all' | 'unread' | 'read';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    clearError,
  } = useNotifications();

  const [filter, setFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: NotificationFilter | null,
  ) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const getFilteredNotifications = (): Notification[] => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'read':
        return notifications.filter(n => n.isRead);
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    if (!notification.isRead) {
      return <UnreadIcon sx={{ fontSize: 12, color: 'primary.main' }} />;
    }
    
    switch (notification.notificationStatus.toLowerCase()) {
      case 'complete':
      case 'delivered':
      case 'ordercreated':
        return <SuccessIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'courierassigned':
      case 'assigned':
        return <InfoIcon sx={{ fontSize: 16, color: 'info.main' }} />;
      default:
        return <NotificationsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
    }
  };

  const getNotificationColor = (notification: Notification) => {
    if (!notification.isRead) return 'action.hover';
    return 'transparent';
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Notifications</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {!isConnected && (
            <Alert severity="warning" variant="outlined" sx={{ py: 0 }}>
              Connection offline
            </Alert>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshNotifications}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={clearError}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        {/* Stats and Controls */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6">
                {notifications.length} Total
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} Unread`}
                  color="primary"
                  size="small"
                />
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <ToggleButtonGroup
                value={filter}
                exclusive
                onChange={handleFilterChange}
                size="small"
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="unread">Unread</ToggleButton>
                <ToggleButton value="read">Read</ToggleButton>
              </ToggleButtonGroup>

              {unreadCount > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MarkReadIcon />}
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Notifications List */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 
               'No notifications yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filter === 'all' && 'You\'ll see order updates and important messages here.'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: getNotificationColor(notification),
                    py: 2,
                    px: 3,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getNotificationIcon(notification)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: !notification.isRead ? 'bold' : 'normal',
                            flex: 1,
                            mr: 2,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          {!notification.isRead && (
                            <IconButton
                              size="small"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <ReadIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          {' • '}
                          {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          {notification.orderId && (
                            <Chip
                              label={`Order #${notification.orderId.substring(0, 8)}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          
                          <Chip
                            label={notification.notificationStatus}
                            size="small"
                            variant="outlined"
                            color={
                              notification.notificationStatus.toLowerCase().includes('complete') ||
                              notification.notificationStatus.toLowerCase().includes('delivered')
                                ? 'success'
                                : notification.notificationStatus.toLowerCase().includes('assigned')
                                ? 'info'
                                : 'default'
                            }
                          />
                        </Box>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
                
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};