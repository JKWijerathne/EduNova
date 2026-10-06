import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a14935]">Administration</p>
        <h1 className="mt-3 font-serif text-4xl">Welcome, {user.name || 'Admin'}.</h1>
        <p className="mt-3 text-[#657570]">Your platform dashboard is ready.</p>
        <div className="mt-10 flex flex-wrap gap-3 border-t border-[#cbd3ca] py-6">
          <Link to="/admin/courses" className="bg-[#254d40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#18392f]">Manage courses</Link>
          <Link to="/admin/enrollments" className="border border-[#bdc9bf] px-5 py-3 text-sm font-semibold hover:bg-[#edf4ef]">Enrollment overview</Link>
          <Link to="/courses" className="border border-[#bdc9bf] px-5 py-3 text-sm font-semibold hover:bg-[#edf4ef]">View catalog</Link>
        </div>
      </section>
    </main>
  )
}