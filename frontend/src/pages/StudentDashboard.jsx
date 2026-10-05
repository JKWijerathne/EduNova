import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export default function StudentDashboard() {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <header className="flex items-center justify-between border-b border-[#d9ded5] bg-white px-6 py-5 sm:px-10">
        <Link to="/student-dashboard" className="text-xl font-bold tracking-tight">EduNova<span className="text-[#bd4c37]">.</span></Link>
        <button onClick={logout} className="border border-[#bdc9bf] px-4 py-2 text-sm font-semibold hover:bg-[#edf4ef]">Sign out</button>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Student space</p>
        <h1 className="mt-3 font-serif text-4xl">Welcome, {user.name || 'Learner'}.</h1>
        <p className="mt-3 text-[#657570]">Your learning dashboard is ready.</p>
        <div className="mt-10 border-t border-[#cbd3ca] py-6">
          <Link to="/courses" className="inline-flex bg-[#254d40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#18392f]">Explore courses</Link>
        </div>
      </section>
    </main>
  )
}