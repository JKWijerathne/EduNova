import { useAuth } from '../context/useAuth.js'

export default function Profile() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Account</p>
        <h1 className="mt-3 font-serif text-4xl">Profile</h1>
        <p className="mt-3 text-[#657570]">Your account information.</p>
        <dl className="mt-8 divide-y divide-[#d9ded5] border-y border-[#cbd3ca] bg-white px-5 sm:px-6">
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm font-semibold text-[#657570]">Name</dt>
            <dd className="text-sm">{user.name || 'Not provided'}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm font-semibold text-[#657570]">Email</dt>
            <dd className="break-all text-sm">{user.email || 'Not provided'}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm font-semibold text-[#657570]">Role</dt>
            <dd className="text-sm">{user.role}</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
