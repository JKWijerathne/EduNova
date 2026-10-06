import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export default function AppHeader() {
  const { user, logout } = useAuth()
  const isAdmin = user.role === 'ADMIN'

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d9ded5] bg-white px-6 py-5 sm:px-10">
      <Link to={isAdmin ? '/admin-dashboard' : '/student-dashboard'} className="text-xl font-bold tracking-tight">EduNova<span className="text-[#bd4c37]">.</span></Link>
      <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold">
        {isAdmin ? (
          <>
            <Link to="/admin-dashboard" className="hover:text-[#bd4c37]">Dashboard</Link>
            <Link to="/admin/courses" className="hover:text-[#bd4c37]">Manage courses</Link>
            <Link to="/admin/enrollments" className="hover:text-[#bd4c37]">Enrollments</Link>
            <Link to="/courses" className="hover:text-[#bd4c37]">Course catalog</Link>
          </>
        ) : (
          <>
            <Link to="/courses" className="hover:text-[#bd4c37]">Course catalog</Link>
            <Link to="/my-enrollments" className="hover:text-[#bd4c37]">My enrollments</Link>
          </>
        )}
        <span className="hidden text-[#657570] sm:inline">{user.name || (isAdmin ? 'Admin' : 'Learner')}</span>
        <button onClick={logout} className="border border-[#bdc9bf] px-4 py-2 hover:bg-[#edf4ef]">Sign out</button>
      </nav>
    </header>
  )
}