import apiClient from './apiClient.js'

export async function enrollInCourse(courseId) {
  const { data } = await apiClient.post('/enrollments', { courseId })
  return data
}

export async function getMyEnrollments() {
  const { data } = await apiClient.get('/enrollments/my-courses')
  return data
}

export async function getAllEnrollments() {
  const { data } = await apiClient.get('/enrollments')
  return data
}

export async function dropEnrollment(enrollmentId) {
  await apiClient.delete(`/enrollments/${enrollmentId}`)
}
