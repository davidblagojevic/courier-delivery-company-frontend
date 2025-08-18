import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { SignalRService, NotificationData } from '../services/signalRService';
import { NotificationsApi, Notification } from '../services/notificationsApi';
import { useAuth } from '../../authentication/context/AuthContext';

// --- STATE AND REDUCER ---

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: true, // Start with loading true
  isConnected: false,
  error: null,
};

// Action types are kept the same
type NotificationsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
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
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        isLoading: false,
        notifications: action.payload,
        unreadCount: action.payload.filter((n) => !n.isRead).length,
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

// --- CONTEXT AND PROVIDER ---

interface NotificationsContextType extends NotificationsState {
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

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
        console.error('SignalR connection failed:', error);
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
        const notifications = await NotificationsApi.getNotifications();
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
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
      console.error('Failed to mark notification as read:', error);
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
      console.error('Failed to mark all notifications as read:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to update notifications.',
      });
    }
  }, [state.notifications]);

  return (
    <NotificationsContext.Provider
      value={{ ...state, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};