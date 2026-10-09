import { useState } from 'react'
import { AuthContext } from './authContext.js'
import apiClient from '../services/apiClient.js'

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(readStoredUser)

  function saveSession(authResponse) {
    if (!authResponse?.token || !authResponse?.role) {
      throw new Error('The server returned an incomplete authentication response.')
    }

    const nextUser = {
      id: authResponse.userId,
      name: authResponse.name,
      email: authResponse.email,
      role: authResponse.role,
    }

    localStorage.setItem('token', authResponse.token)
    localStorage.setItem('user', JSON.stringify(nextUser))
    setToken(authResponse.token)
    setUser(nextUser)
    return nextUser
  }

  async function login(credentials) {
    const { data } = await apiClient.post('/auth/login', credentials)
    return saveSession(data)
  }

  async function googleLogin(idToken) {
    const { data } = await apiClient.post('/auth/google', { idToken })
    return saveSession(data)
  }

  async function register(userData) {
    const { data } = await apiClient.post('/auth/register', userData)
    return saveSession(data)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: Boolean(token && user), login, googleLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}