import { useEffect, useState } from 'react'

const emptyCourse = { title: '', description: '', instructorName: '', duration: '', category: '', price: '' }

function messageFromError(error) {
  const status = error.response?.status
  if (status === 401) return 'Your session has expired. Sign in again, then retry.'
  if (status === 403) return 'Your account is not authorized to manage courses. Sign in with an administrator account.'

  const responseMessage = error.response?.data?.message || error.response?.data?.error
  if (responseMessage) return responseMessage
  if (!error.response) return 'The API could not be reached. Check that the gateway and course service are running.'
  return `Course could not be saved (HTTP ${status}). Please try again.`
}

export default function CourseForm({ course, onClose, onSave }) {
  const [form, setForm] = useState(emptyCourse)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(course ? {
      title: course.title || '',
      description: course.description || '',
      instructorName: course.instructorName || '',
      duration: course.duration || '',
      category: course.category || '',
      price: course.price ?? '',
    } : emptyCourse)
  }, [course])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave({ ...form, price: form.price === '' ? null : Number(form.price) })
      onClose()
    } catch (saveError) {
      setError(messageFromError(saveError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#172d2a]/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="course-form-title" className="my-auto w-full max-w-2xl bg-[#fbfcf8] p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#68817b]">Course management</p>
            <h2 id="course-form-title" className="mt-2 font-serif text-3xl">{course ? 'Edit course' : 'Add a course'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="px-2 py-1 text-xl text-[#52645f] hover:text-[#bd4c37]">×</button>
        </div>
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Course title
            <input name="title" required maxLength="150" value={form.title} onChange={updateField} className="border border-[#bdc9bf] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#426e5c]" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Instructor
            <input name="instructorName" maxLength="120" value={form.instructorName} onChange={updateField} className="border border-[#bdc9bf] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#426e5c]" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Duration
            <input name="duration" maxLength="80" value={form.duration} onChange={updateField} placeholder="e.g. 6 weeks" className="border border-[#bdc9bf] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#426e5c]" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Category
            <input name="category" maxLength="80" value={form.category} onChange={updateField} placeholder="e.g. Design" className="border border-[#bdc9bf] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#426e5c]" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Price (USD)
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} placeholder="0.00" className="border border-[#bdc9bf] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#426e5c]" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Description
            <textarea name="description" rows="5" value={form.description} onChange={updateField} className="resize-y border border-[#bdc9bf] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#426e5c]" />
          </label>
          {error && <p role="alert" className="border-l-4 border-[#bd4c37] bg-[#f8e9e4] px-3 py-2 text-sm sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="border border-[#bdc9bf] px-4 py-2.5 text-sm font-semibold hover:bg-[#edf4ef]">Cancel</button>
            <button type="submit" disabled={saving} className="bg-[#254d40] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#18392f] disabled:opacity-60">{saving ? 'Saving...' : course ? 'Save changes' : 'Create course'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
