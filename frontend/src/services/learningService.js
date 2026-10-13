import apiClient from './apiClient.js'

export async function getCourseCurriculum(courseId) {
  const { data } = await apiClient.get(`/courses/${courseId}/curriculum`)
  return data
}

export async function createSection(section) {
  const { data } = await apiClient.post('/courses/sections', section)
  return data
}

export async function updateSection(sectionId, section) {
  const { data } = await apiClient.put(`/courses/sections/${sectionId}`, section)
  return data
}

export async function deleteSection(sectionId) {
  await apiClient.delete(`/courses/sections/${sectionId}`)
}

export async function createLesson(lesson) {
  const { data } = await apiClient.post('/courses/lessons', lesson)
  return data
}

export async function updateLesson(lessonId, lesson) {
  const { data } = await apiClient.put(`/courses/lessons/${lessonId}`, lesson)
  return data
}

export async function deleteLesson(lessonId) {
  await apiClient.delete(`/courses/lessons/${lessonId}`)
}

export async function reorderSections(courseId, sectionIds) {
  const { data } = await apiClient.put('/courses/sections/order', { courseId, sectionIds })
  return data
}

export async function reorderLessons(sectionId, lessonIds) {
  const { data } = await apiClient.put('/courses/lessons/order', { sectionId, lessonIds })
  return data
}

export async function completeLesson(lessonId) {
  await apiClient.post(`/progress/lessons/${lessonId}/complete`)
}

export async function getCourseProgress(courseId) {
  const { data } = await apiClient.get(`/progress/courses/${courseId}`)
  return data
}
