import apiClient from './apiClient.js'

export async function getMyNotifications() {
  const { data } = await apiClient.get('/notifications')
  return data
}

export async function createNotification(notification) {
  const { data } = await apiClient.post('/notifications', notification)
  return data
}

export async function recordEnrollmentNotification(studentId, courseId) {
  await apiClient.post('/notifications/enrollment', { studentId, courseId })
}

export async function recordCourseDropNotification(studentId, courseId) {
  await apiClient.post('/notifications/course-drop', { studentId, courseId })
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await apiClient.put(`/notifications/${notificationId}/read`)
  return data
}

export async function deleteNotification(notificationId) {
  await apiClient.delete(`/notifications/${notificationId}`)
}
