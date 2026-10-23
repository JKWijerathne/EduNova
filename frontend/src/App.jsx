import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/useAuth.js'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminCourses from './pages/AdminCourses.jsx'
import AdminCourseContent from './pages/AdminCourseContent.jsx'
import AdminEnrollments from './pages/AdminEnrollments.jsx'
import CourseCatalog from './pages/CourseCatalog.jsx'
import CourseDetails from './pages/CourseDetails.jsx'
import CoursePlayer from './pages/CoursePlayer.jsx'
import Login from './pages/Login.jsx'
import MyLearning from './pages/MyLearning.jsx'
import MyEnrollments from './pages/MyEnrollments.jsx'
import Notifications from './pages/Notifications.jsx'
import WorkspacePlaceholder from './pages/WorkspacePlaceholder.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={user.role === 'ADMIN' ? '/admin-dashboard' : user.role === 'INSTRUCTOR' ? '/admin/courses' : '/student-dashboard'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/courses" element={<CourseCatalog />} />
          <Route path="/courses/:courseId" element={<CourseDetails />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route element={<ProtectedRoute allowedRole="STUDENT" />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/my-enrollments" element={<MyEnrollments />} />
            <Route path="/my-learning" element={<MyLearning />} />
            <Route path="/courses/:courseId/player" element={<CoursePlayer />} />
          </Route>
          <Route element={<ProtectedRoute allowedRole={['ADMIN', 'INSTRUCTOR']} />}>
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/courses/:courseId/content" element={<AdminCourseContent />} />
          </Route>
          <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/enrollments" element={<AdminEnrollments />} />
            <Route path="/admin/users" element={<WorkspacePlaceholder title="User Management" description="User management is not available yet. No user-management API or screen is currently connected." />} />
            <Route path="/admin/notifications" element={<WorkspacePlaceholder title="Notification Management" description="Admin notification management is not available yet. Notifications can still be viewed and managed from the Notifications page." />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}