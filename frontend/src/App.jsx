import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/useAuth.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminCourses from './pages/AdminCourses.jsx'
import AdminEnrollments from './pages/AdminEnrollments.jsx'
import CourseCatalog from './pages/CourseCatalog.jsx'
import CourseDetails from './pages/CourseDetails.jsx'
import Login from './pages/Login.jsx'
import MyEnrollments from './pages/MyEnrollments.jsx'
import Register from './pages/Register.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={user.role === 'ADMIN' ? '/admin-dashboard' : '/student-dashboard'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/:courseId" element={<CourseDetails />} />
      </Route>
      <Route element={<ProtectedRoute allowedRole="STUDENT" />}>
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
      </Route>
      <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/enrollments" element={<AdminEnrollments />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}