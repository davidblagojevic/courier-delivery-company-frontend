import { createContext, useContext } from 'react';
import { type NotificationsContextType } from '../types';

// Kept in a component-free module so React Fast Refresh never re-executes
// createContext during HMR (which would orphan already-mounted consumers).
export const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
