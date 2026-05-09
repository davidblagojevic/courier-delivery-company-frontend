import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkReadIcon,
  Circle as UnreadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import { type Notification as NotificationItem } from '../services/notificationsApi';
import { NotificationFilter } from '../types/NotificationFilter';
import { formatDistanceToNow } from 'date-fns';
import { routes } from 'router';

export const NotificationBadge: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [displayedNotifications, setDisplayedNotifications] = useState<NotificationItem[]>([]);
  const [showCount, setShowCount] = useState(10);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    isLoadingMore,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    loadMoreNotifications,
  } = useNotifications();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleViewAllNotifications = () => {
    handleClose();
    navigate(routes.NOTIFICATIONS);
  };

  const handleLoadMore = async () => {
    if (showCount >= notifications.length && hasMore) {
      await loadMoreNotifications(NotificationFilter.All);
    } else if (showCount < notifications.length) {
      setShowCount(prev => Math.min(prev + 10, notifications.length));
    }
  };

  React.useEffect(() => {
    setDisplayedNotifications(notifications.slice(0, Math.min(showCount, 20)));
  }, [notifications, showCount]);

  React.useEffect(() => {
    if (notifications.length < showCount && notifications.length <= 10) {
      setShowCount(10);
    } else if (notifications.length > showCount && isLoadingMore === false) {
      // When new notifications are loaded via loadMore, expand showCount to show them
      setShowCount(Math.min(notifications.length, 20));
    }
  }, [notifications.length, showCount, isLoadingMore]);

  const open = Boolean(anchorEl);
  const canShowMore = (showCount < notifications.length && showCount < 20) || (showCount >= notifications.length && hasMore && !isLoadingMore);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="notifications"
        aria-controls={open ? 'notifications-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Notifications</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {!isConnected && (
                <Chip
                  label="Offline"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {isLoading && <CircularProgress size={16} />}
              <Button
                size="small"
                onClick={() => {
                  setShowCount(10);
                  refreshNotifications(NotificationFilter.All);
                }}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllAsRead}
              sx={{ mt: 1 }}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider />

        {/* Notifications List */}
        {displayedNotifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {displayedNotifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                sx={{
                  borderLeft: !notification.isRead ? '4px solid' : '4px solid transparent',
                  borderLeftColor: !notification.isRead ? 'primary.main' : 'transparent',
                  bgcolor: !notification.isRead ? 'action.hover' : 'transparent',
                  alignItems: 'flex-start',
                  minHeight: 80,
                }}
              >
                <Box sx={{ mr: 1, mt: 0.5 }}>
                  {!notification.isRead ? (
                    <UnreadIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                  ) : (
                    <Box sx={{ width: 8, height: 8 }} />
                  )}
                </Box>
                
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: !notification.isRead ? 'bold' : 'normal',
                        mb: 0.5,
                      }}
                    >
                      {notification.message}
                    </Typography>
                  }
                  secondary={
                    <span>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                      {notification.orderId && (
                        <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 1 }}>
                          • Order #{notification.orderId.substring(0, 8)}...
                        </Typography>
                      )}
                    </span>
                  }
                />
              </MenuItem>
            ))}
          </Box>
        )}

        <Divider />
        
        {/* Footer with Load More and View All */}
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {canShowMore && (
            <Button 
              size="small" 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              startIcon={isLoadingMore ? <CircularProgress size={16} /> : undefined}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </Button>
          )}
          <Button size="small" onClick={handleViewAllNotifications}>
            View all notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};