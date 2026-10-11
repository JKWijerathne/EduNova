import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse } from '../services/courseService.js'
import {
  createLesson,
  createSection,
  getCourseCurriculum,
  reorderLessons,
  reorderSections,
} from '../services/learningService.js'

const inputClass = 'w-full border border-[#bdc9bf] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#426e5c]'
const buttonClass = 'border border-[#bdc9bf] px-3 py-2 text-xs font-semibold hover:bg-[#edf4ef] disabled:cursor-not-allowed disabled:opacity-50'

function messageFor(error, fallback) {
  return error.response?.data?.detail || error.response?.data?.message || fallback
}

export default function AdminCourseContent() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [sectionTitle, setSectionTitle] = useState('')
  const [lessonSectionId, setLessonSectionId] = useState(null)
  const [lessonForm, setLessonForm] = useState({ title: '', contentType: 'VIDEO', contentUrl: '', bodyText: '', duration: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const loadCourse = useCallback(async () => {
    setError('')
    try {
      const [courseData, curriculum] = await Promise.all([getCourse(courseId), getCourseCurriculum(courseId)])
      setCourse(courseData)
      setSections(Array.isArray(curriculum) ? curriculum : [])
    } catch (loadError) {
      setError(messageFor(loadError, 'Course content could not be loaded. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { loadCourse() }, [loadCourse])

  async function handleAddSection(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      await createSection({ courseId: Number(courseId), title: sectionTitle.trim(), sortOrder: sections.length })
      setSectionTitle('')
      setFeedback('Section added.')
      await loadCourse()
    } catch (saveError) {
      setError(messageFor(saveError, 'Section could not be added. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddLesson(event, section) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      await createLesson({
        sectionId: section.id,
        title: lessonForm.title.trim(),
        contentType: lessonForm.contentType,
        contentUrl: lessonForm.contentType === 'TEXT' ? null : lessonForm.contentUrl.trim(),
        bodyText: lessonForm.contentType === 'TEXT' ? lessonForm.bodyText.trim() : null,
        duration: lessonForm.duration === '' ? null : Number(lessonForm.duration),
        sortOrder: section.lessons.length,
      })
      setLessonSectionId(null)
      setLessonForm({ title: '', contentType: 'VIDEO', contentUrl: '', bodyText: '', duration: '' })
      setFeedback('Lesson added.')
      await loadCourse()
    } catch (saveError) {
      setError(messageFor(saveError, 'Lesson could not be added. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function moveSection(index, offset) {
    const reordered = [...sections]
    const target = index + offset
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setSaving(true)
    setError('')
    try {
      setSections(await reorderSections(Number(courseId), reordered.map((section) => section.id)))
    } catch (saveError) {
      setError(messageFor(saveError, 'Section order could not be saved. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function moveLesson(section, index, offset) {
    const lessons = [...section.lessons]
    const target = index + offset
    ;[lessons[index], lessons[target]] = [lessons[target], lessons[index]]
    setSaving(true)
    setError('')
    try {
      const reordered = await reorderLessons(section.id, lessons.map((lesson) => lesson.id))
      setSections((current) => current.map((item) => item.id === section.id ? { ...item, lessons: reordered } : item))
    } catch (saveError) {
      setError(messageFor(saveError, 'Lesson order could not be saved. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <Link to="/admin/courses" className="text-sm font-semibold text-[#426e5c] hover:underline">← Course management</Link>
        {loading && <p className="py-12 text-[#657570]">Loading course content...</p>}
        {!loading && course && (
          <>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#a14935]">Learning content</p>
            <h1 className="mt-2 font-serif text-4xl">{course.title}</h1>
            <form onSubmit={handleAddSection} className="mt-8 flex flex-col gap-3 border-y border-[#cbd3ca] bg-white p-4 sm:flex-row">
              <label className="sr-only" htmlFor="new-section-title">New section title</label>
              <input id="new-section-title" required value={sectionTitle} onChange={(event) => setSectionTitle(event.target.value)} placeholder="New section title" className={inputClass} />
              <button disabled={saving} className="shrink-0 bg-[#254d40] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#18392f] disabled:opacity-60">{saving ? 'Saving...' : 'Add section'}</button>
            </form>
            {feedback && <p role="status" className="mt-4 border-l-4 border-[#426e5c] bg-[#edf4ef] px-4 py-3 text-sm">{feedback}</p>}
            {error && <p role="alert" className="mt-4 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
            {sections.length === 0 && <p className="py-10 text-sm text-[#657570]">No sections yet. Add a section to start building this course.</p>}
            <div className="mt-6 space-y-5">
              {sections.map((section, sectionIndex) => (
                <section key={section.id} className="border border-[#d9ded5] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9ded5] bg-[#e8ede6] px-4 py-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#68817b]">Section {sectionIndex + 1}</p>
                      <h2 className="mt-1 font-serif text-xl">{section.title}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className={buttonClass} aria-label={`Move ${section.title} up`} disabled={saving || sectionIndex === 0} onClick={() => moveSection(sectionIndex, -1)}>Move up</button>
                      <button type="button" className={buttonClass} aria-label={`Move ${section.title} down`} disabled={saving || sectionIndex === sections.length - 1} onClick={() => moveSection(sectionIndex, 1)}>Move down</button>
                      <button type="button" className="bg-[#254d40] px-3 py-2 text-xs font-semibold text-white hover:bg-[#18392f]" onClick={() => setLessonSectionId(lessonSectionId === section.id ? null : section.id)}>Add lesson</button>
                    </div>
                  </div>
                  <ol className="divide-y divide-[#edf0e9]">
                    {section.lessons.map((lesson, lessonIndex) => (
                      <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="font-semibold">{lesson.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-[#68817b]">{lesson.contentType}{lesson.duration ? ` · ${lesson.duration} min` : ''}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className={buttonClass} aria-label={`Move ${lesson.title} up`} disabled={saving || lessonIndex === 0} onClick={() => moveLesson(section, lessonIndex, -1)}>Move up</button>
                          <button type="button" className={buttonClass} aria-label={`Move ${lesson.title} down`} disabled={saving || lessonIndex === section.lessons.length - 1} onClick={() => moveLesson(section, lessonIndex, 1)}>Move down</button>
                        </div>
                      </li>
                    ))}
                    {section.lessons.length === 0 && <li className="px-4 py-4 text-sm text-[#657570]">No lessons in this section yet.</li>}
                  </ol>
                  {lessonSectionId === section.id && (
                    <form onSubmit={(event) => handleAddLesson(event, section)} className="space-y-3 border-t border-[#d9ded5] bg-[#fbfcf8] p-4">
                      <h3 className="font-semibold">Add lesson to {section.title}</h3>
                      <label className="block text-sm font-medium">Lesson title
                        <input required value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} className={`mt-1 ${inputClass}`} />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm font-medium">Content type
                          <select value={lessonForm.contentType} onChange={(event) => setLessonForm({ ...lessonForm, contentType: event.target.value })} className={`mt-1 ${inputClass}`}>
                            {['VIDEO', 'PDF', 'TEXT', 'LINK'].map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium">Duration (minutes)
                          <input type="number" min="0" value={lessonForm.duration} onChange={(event) => setLessonForm({ ...lessonForm, duration: event.target.value })} className={`mt-1 ${inputClass}`} />
                        </label>
                      </div>
                      {lessonForm.contentType === 'TEXT' ? (
                        <label className="block text-sm font-medium">Lesson text
                          <textarea required rows="5" value={lessonForm.bodyText} onChange={(event) => setLessonForm({ ...lessonForm, bodyText: event.target.value })} className={`mt-1 ${inputClass}`} />
                        </label>
                      ) : (
                        <label className="block text-sm font-medium">Content URL
                          <input type="url" required value={lessonForm.contentUrl} onChange={(event) => setLessonForm({ ...lessonForm, contentUrl: event.target.value })} placeholder="https://" className={`mt-1 ${inputClass}`} />
                        </label>
                      )}
                      <div className="flex justify-end gap-2">
                        <button type="button" className={buttonClass} onClick={() => setLessonSectionId(null)}>Cancel</button>
                        <button disabled={saving} className="bg-[#254d40] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save lesson'}</button>
                      </div>
                    </form>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
