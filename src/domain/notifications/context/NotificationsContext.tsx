import React, {
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { SignalRService, type NotificationData } from '../services/signalRService';
import { NotificationsApi, type Notification, type NotificationsResponse } from '../services/notificationsApi';
import { NotificationFilter } from '../types/NotificationFilter';
import { type NotificationsState } from '../types';
import { useAuth } from 'domain/authentication';
import { log } from 'shared/log';
import { NotificationsContext } from './useNotifications';

// --- STATE AND REDUCER ---

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  hasMore: false,
  isLoading: true, // Start with loading true
  isLoadingMore: false,
  isConnected: false,
  error: null,
};

// Action types are kept the same
type NotificationsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: NotificationsResponse }
  | { type: 'LOAD_MORE_NOTIFICATIONS'; payload: NotificationsResponse }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// A more efficient reducer that avoids re-filtering the entire array on every update.
const notificationsReducer = (
  state: NotificationsState,
  action: NotificationsAction,
): NotificationsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_LOADING_MORE':
      return { ...state, isLoadingMore: action.payload };
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        isLoading: false,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        totalCount: action.payload.totalCount,
        hasMore: action.payload.hasMore,
      };
    case 'LOAD_MORE_NOTIFICATIONS':
      return {
        ...state,
        isLoadingMore: false,
        notifications: [...state.notifications, ...action.payload.notifications],
        unreadCount: action.payload.unreadCount,
        totalCount: action.payload.totalCount,
        hasMore: action.payload.hasMore,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1, // Simply increment
      };
    case 'MARK_AS_READ': {
      let wasUnread = false;
      const updatedNotifications = state.notifications.map((n) => {
        if (n.id === action.payload && !n.isRead) {
          wasUnread = true;
          return { ...n, isRead: true };
        }
        return n;
      });
      return {
        ...state,
        notifications: updatedNotifications,
        // Decrement only if an unread item was actually changed
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    }
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      };
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};


export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(notificationsReducer, initialState);
  const { token, isAuthenticated } = useAuth();
  const signalRServiceRef = useRef<SignalRService | null>(null);

  // Memoize the handler for SignalR
  const handleSignalRNotification = useCallback(
    (notificationData: NotificationData) => {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: notificationData.id,
          orderId: notificationData.orderId || '',
          message: notificationData.message,
          createdAt: notificationData.createdAt,
          notificationStatus: notificationData.notificationStatus || notificationData.type,
          isRead: false,
        },
      });
    },
    [],
  );

  // Effect for initializing and cleaning up SignalR connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      signalRServiceRef.current?.stop();
      signalRServiceRef.current = null;
      return;
    }

    const hubUrl = '/notificationHub';
    const service = new SignalRService(hubUrl, () => token);
    signalRServiceRef.current = service;

    service.setConnectionStateChangeCallback((isConnected) => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: isConnected });
    });

    service
      .start()
      .then(() => {
        // Set up the listener once the connection is confirmed
        service.onNotificationReceived(handleSignalRNotification);
      })
      .catch((error) => {
        log.error('SignalR connection failed:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to connect to notification service.',
        });
      });

    // Cleanup function
    return () => {
      service.stop();
      signalRServiceRef.current = null;
    };
  }, [isAuthenticated, token, handleSignalRNotification]);

  // Effect for fetching initial notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await NotificationsApi.getNotifications(NotificationFilter.All, 0, 10);
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response });
      } catch (error) {
        log.error('Failed to fetch notifications:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications.' });
      }
    };

    fetchNotifications();
  }, [isAuthenticated]);

  // --- API ACTIONS ---

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistically update UI first
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
      await NotificationsApi.markAsRead(notificationId);
    } catch (error) {
      log.error('Failed to mark notification as read:', error);
      // NOTE: Here you could add logic to revert the optimistic update on failure
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to update notification status.',
      });
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = state.notifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    // Optimistically update the UI
    dispatch({ type: 'MARK_ALL_AS_READ' });

    try {
      // This is inefficient and should ideally be a single API call.
      // Keeping original logic as requested.
      await Promise.all(
        unreadIds.map((id) => NotificationsApi.markAsRead(id)),
      );
    } catch (error) {
      log.error('Failed to mark all notifications as read:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to update notifications.',
      });
    }
  }, [state.notifications]);

  const refreshNotifications = useCallback(async (filter: NotificationFilter = NotificationFilter.All) => {
    if (!isAuthenticated) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await NotificationsApi.getNotifications(filter, 0, 10);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: response });
    } catch (error) {
      log.error('Failed to refresh notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh notifications.' });
    }
  }, [isAuthenticated]);

  const loadMoreNotifications = useCallback(async (filter: NotificationFilter = NotificationFilter.All) => {
    if (!isAuthenticated || state.isLoadingMore || !state.hasMore) return;
    
    dispatch({ type: 'SET_LOADING_MORE', payload: true });
    try {
      const response = await NotificationsApi.getNotifications(filter, state.notifications.length, 10);
      dispatch({ type: 'LOAD_MORE_NOTIFICATIONS', payload: response });
    } catch (error) {
      log.error('Failed to load more notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load more notifications.' });
    }
  }, [isAuthenticated, state.isLoadingMore, state.hasMore, state.notifications.length]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ ...state, markAsRead, markAllAsRead, refreshNotifications, loadMoreNotifications, clearError }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};