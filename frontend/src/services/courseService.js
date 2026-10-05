import apiClient from './apiClient.js'

export async function getCourses() {
  const { data } = await apiClient.get('/courses')
  return data
}

export async function getCourse(courseId) {
  const { data } = await apiClient.get(`/courses/${courseId}`)
  return data
}

export async function createCourse(course) {
  const { data } = await apiClient.post('/courses', course)
  return data
}

export async function updateCourse(courseId, course) {
  const { data } = await apiClient.put(`/courses/${courseId}`, course)
  return data
}

export async function deleteCourse(courseId) {
  await apiClient.delete(`/courses/${courseId}`)
}
