export enum NotificationFilter {
  All = 'all',
  Unread = 'unread',
  Read = 'read'
}

export type NotificationFilterType = keyof typeof NotificationFilter;