export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}

