import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth.js'
import { NotificationContext } from './notificationContext.js'
import {
  deleteNotification,
  getMyNotifications,
  markNotificationAsRead,
} from '../services/notificationService.js'

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || user?.id == null) {
      setNotifications([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await getMyNotifications(user.id)
      if (!Array.isArray(result)) {
        throw new Error('The notification service returned an invalid response.')
      }
      setNotifications(result)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Notifications could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setError('')
      setLoading(false)
      return
    }
    refreshNotifications()
  }, [isAuthenticated, refreshNotifications])

  const markAsRead = useCallback(async (notificationId) => {
    const updatedNotification = await markNotificationAsRead(notificationId)
    setNotifications((current) => current.map((notification) => (
      String(notification.id) === String(notificationId)
        ? { ...notification, ...updatedNotification, read: true }
        : notification
    )))
  }, [])

  const dismissNotification = useCallback(async (notificationId) => {
    await deleteNotification(notificationId)
    setNotifications((current) => current.filter(
      (notification) => String(notification.id) !== String(notificationId),
    ))
  }, [])

  const value = useMemo(() => ({
    notifications,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    dismissNotification,
  }), [notifications, loading, error, refreshNotifications, markAsRead, dismissNotification])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
