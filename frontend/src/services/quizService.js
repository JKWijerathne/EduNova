import apiClient from './apiClient.js'

export async function createQuiz(quiz) {
  const { data } = await apiClient.post('/quizzes', quiz)
  return data
}

export async function getQuiz(quizId) {
  const { data } = await apiClient.get(`/quizzes/${quizId}`)
  return data
}

export async function submitQuiz(quizId, answers) {
  const { data } = await apiClient.post(`/quizzes/${quizId}/submit`, { answers })
  return data
}
