import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function destinationFor(role) {
  return role === 'ADMIN' ? '/admin-dashboard' : '/student-dashboard'
}

export default function Login() {
  const { isAuthenticated, login, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={destinationFor(user.role)} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const authenticatedUser = await login(form)
      navigate(destinationFor(authenticatedUser.role), { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a] md:grid md:grid-cols-[minmax(320px,0.9fr)_1.1fr]">
      <section className="relative flex min-h-[270px] flex-col overflow-hidden bg-[#174c43] px-7 py-8 text-[#f7f5e9] sm:px-12 sm:py-10 md:min-h-screen md:px-14 md:py-12">
        <div className="absolute -right-20 top-24 h-64 w-64 rounded-full border border-white/15" />
        <div className="absolute -right-5 top-39 h-64 w-64 rounded-full border border-white/15" />
        <div className="relative flex flex-col items-start gap-12 md:gap-20">
          <Link to="/login" className="w-fit text-xl font-bold tracking-tight">EduNova<span className="text-[#d7e36a]">.</span></Link>
          <div className="max-w-lg">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d7e36a]">Learning, in motion</p>
            <h1 className="max-w-md font-serif text-4xl leading-[1.05] sm:text-5xl">
              <span className="block">Keep learning.</span>
              <span className="block">Keep growing.</span>
              <span className="block">Keep moving forward.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/75">Pick up where curiosity takes you. Your next lesson is closer than you think.</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12 md:px-16">
        <div className="w-full max-w-md">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Welcome back</p>
          <h2 className="font-serif text-3xl">Sign in to EduNova</h2>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && <p role="alert" className="rounded-sm border-l-4 border-[#bd4c37] bg-[#fbe9e3] px-4 py-3 text-sm text-[#7f2f22]">{error}</p>}
            <label className="block text-sm font-semibold" htmlFor="email">
              Email address
              <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 block w-full border border-[#cbd3ca] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#247465] focus:ring-2 focus:ring-[#247465]/15" />
            </label>
            <label className="block text-sm font-semibold" htmlFor="password">
              Password
              <input id="password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 block w-full border border-[#cbd3ca] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#247465] focus:ring-2 focus:ring-[#247465]/15" />
            </label>
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#174c43] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#23675b] disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[#657570]">New to EduNova? <Link to="/register" className="font-bold text-[#176457] underline decoration-[#a4b9a8] underline-offset-4 hover:text-[#0d4037]">Create an account</Link></p>
        </div>
      </section>
    </main>
  )
}