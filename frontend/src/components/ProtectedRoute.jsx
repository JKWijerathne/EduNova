import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import AppHeader from './AppHeader.jsx'

export default function ProtectedRoute({ allowedRole }) {
  const { isAuthenticated, user } = useAuth()
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole]

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin-dashboard' : '/student-dashboard'} replace />
  }

  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  )
}