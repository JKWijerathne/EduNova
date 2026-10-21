import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export default function ProtectedRoute({ allowedRole }) {
  const { isAuthenticated, user } = useAuth()
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole]

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && !allowedRoles.includes(user.role)) {
    const homePath = user.role === 'ADMIN'
      ? '/admin-dashboard'
      : user.role === 'INSTRUCTOR'
        ? '/admin/courses'
        : '/student-dashboard'
    return <Navigate to={homePath} replace />
  }

  return <Outlet />
}