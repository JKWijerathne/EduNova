import apiClient from './apiClient.js'

export async function getMyProfile() {
  const { data } = await apiClient.get('/auth/me')
  return data
}

export async function updateMyProfile(profile) {
  const { data } = await apiClient.patch('/auth/me', profile)
  return data
}

export async function changeMyPassword(passwords) {
  await apiClient.post('/auth/me/password', passwords)
}
