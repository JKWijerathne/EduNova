import apiClient from './apiClient.js'

export async function getMyNotifications(studentId) {
  const { data } = await apiClient.get(`/notifications/student/${studentId}`)
  return data
}

export async function createNotification(notification) {
  const { data } = await apiClient.post('/notifications', notification)
  return data
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await apiClient.put(`/notifications/${notificationId}/read`)
  return data
}

export async function deleteNotification(notificationId) {
  await apiClient.delete(`/notifications/${notificationId}`)
}
