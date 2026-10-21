export default function WorkspacePlaceholder({ title, description }) {
  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Workspace</p>
        <h1 className="mt-3 font-serif text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-[#657570]">{description}</p>
      </section>
    </main>
  )
}
