import apiClient from './apiClient.js'

export async function getDashboardStats(courseIds = []) {
  const params = courseIds.length ? { courseIds: courseIds.join(',') } : undefined
  const { data } = await apiClient.get('/dashboard/stats', { params })
  return data
}

export async function getActivityHeatmap() {
  const { data } = await apiClient.get('/dashboard/activity-heatmap')
  return data
}

export async function recordStudyHeartbeat() {
  await apiClient.post('/dashboard/heartbeat')
}
