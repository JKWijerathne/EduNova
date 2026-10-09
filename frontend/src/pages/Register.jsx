import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'

function destinationFor(role) {
  return role === 'ADMIN' ? '/admin-dashboard' : '/student-dashboard'
}

export default function Register() {
  const { isAuthenticated, register, googleLogin, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' })
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
      const authenticatedUser = await register(form)
      navigate(destinationFor(authenticatedUser.role), { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleCredential(idToken) {
    const authenticatedUser = await googleLogin(idToken)
    navigate(destinationFor(authenticatedUser.role), { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#f3f4ed] px-5 py-8 text-[#172d2a] sm:px-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link to="/login" className="text-xl font-bold tracking-tight">EduNova<span className="text-[#bd4c37]">.</span></Link>
      </div>

      <section className="mx-auto mt-10 grid max-w-5xl overflow-hidden border border-[#d9ded5] bg-white md:mt-16 md:grid-cols-[0.75fr_1.25fr]">
        <div className="flex flex-col justify-between bg-[#dce8d8] p-7 sm:p-10 md:min-h-[610px]">
          <div className="py-8">
            <p className="font-serif text-4xl leading-tight">Every achievement begins with the courage to begin.</p>
            <div className="mt-8 h-1 w-16 bg-[#bd4c37]" />
            <p className="mt-5 max-w-xs text-sm leading-6 text-[#52665f]">Build a learning rhythm that fits your life and your ambitions.</p>
          </div>
        </div>

        <div className="p-6 sm:p-10 md:p-12">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Create your account</p>
          <h1 className="font-serif text-3xl">Join the learning community</h1>
          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            {error && <p role="alert" className="rounded-sm border-l-4 border-[#bd4c37] bg-[#fbe9e3] px-4 py-3 text-sm text-[#7f2f22]">{error}</p>}
            <label className="block text-sm font-semibold" htmlFor="name">
              Full name
              <input id="name" name="name" type="text" autoComplete="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 block w-full border border-[#cbd3ca] px-4 py-3 font-normal outline-none transition focus:border-[#247465] focus:ring-2 focus:ring-[#247465]/15" />
            </label>
            <label className="block text-sm font-semibold" htmlFor="email">
              Email address
              <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 block w-full border border-[#cbd3ca] px-4 py-3 font-normal outline-none transition focus:border-[#247465] focus:ring-2 focus:ring-[#247465]/15" />
            </label>
            <label className="block text-sm font-semibold" htmlFor="password">
              Password
              <input id="password" name="password" type="password" autoComplete="new-password" minLength="8" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 block w-full border border-[#cbd3ca] px-4 py-3 font-normal outline-none transition focus:border-[#247465] focus:ring-2 focus:ring-[#247465]/15" />
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">I am joining as a</legend>
              <div className="grid grid-cols-2 gap-3">
                {[['STUDENT', 'Student', 'Learn courses and track progress'], ['ADMIN', 'Admin', 'Manage the learning platform']].map(([role, title, description]) => (
                  <label key={role} className={`cursor-pointer border p-3 transition ${form.role === role ? 'border-[#247465] bg-[#edf4ef] ring-1 ring-[#247465]' : 'border-[#cbd3ca] hover:border-[#78958b]'}`}>
                    <input className="sr-only" type="radio" name="role" value={role} checked={form.role === role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
                    <span className="block text-sm font-bold">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#657570]">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" disabled={isSubmitting} className="w-full bg-[#174c43] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#23675b] disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <div className="my-6 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-[#82908a]">
            <span className="h-px flex-1 bg-[#d9ded5]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[#d9ded5]" />
          </div>
          <GoogleSignInButton onCredential={handleGoogleCredential} disabled={isSubmitting} />
          <p className="mt-5 text-center text-sm text-[#657570]">Already have an account? <Link to="/login" className="font-bold text-[#176457] underline underline-offset-4">Sign in</Link></p>
        </div>
      </section>
    </main>
  )
}