import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse } from '../services/courseService.js'
import {
  createLesson,
  createSection,
  deleteLesson,
  deleteSection,
  getCourseCurriculum,
  reorderLessons,
  reorderSections,
  updateLesson,
  updateSection,
} from '../services/learningService.js'

const inputClass = 'w-full border border-[#bdc9bf] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#426e5c]'
const buttonClass = 'border border-[#bdc9bf] px-3 py-2 text-xs font-semibold hover:bg-[#edf4ef] disabled:cursor-not-allowed disabled:opacity-50'
const emptyLessonForm = { title: '', contentType: 'VIDEO', contentUrl: '', bodyText: '', duration: '' }

function messageFor(error, fallback) {
  return error.response?.data?.detail || error.response?.data?.message || fallback
}

function moveItem(items, fromIndex, toIndex) {
  const reordered = [...items]
  const [item] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, item)
  return reordered
}

function LessonFields({ form, setForm, idPrefix }) {
  return (
    <>
      <label className="block text-sm font-medium" htmlFor={`${idPrefix}-title`}>Lesson title
        <input id={`${idPrefix}-title`} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={`mt-1 ${inputClass}`} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium" htmlFor={`${idPrefix}-type`}>Content type
          <select id={`${idPrefix}-type`} value={form.contentType} onChange={(event) => setForm({ ...form, contentType: event.target.value })} className={`mt-1 ${inputClass}`}>
            {['VIDEO', 'PDF', 'TEXT', 'LINK'].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium" htmlFor={`${idPrefix}-duration`}>Duration (minutes)
          <input id={`${idPrefix}-duration`} type="number" min="0" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} className={`mt-1 ${inputClass}`} />
        </label>
      </div>
      {form.contentType === 'TEXT' ? (
        <label className="block text-sm font-medium" htmlFor={`${idPrefix}-body`}>Lesson text
          <textarea id={`${idPrefix}-body`} required rows="5" value={form.bodyText} onChange={(event) => setForm({ ...form, bodyText: event.target.value })} className={`mt-1 ${inputClass}`} />
        </label>
      ) : (
        <label className="block text-sm font-medium" htmlFor={`${idPrefix}-url`}>Content URL
          <input id={`${idPrefix}-url`} type="url" required value={form.contentUrl} onChange={(event) => setForm({ ...form, contentUrl: event.target.value })} placeholder="https://" className={`mt-1 ${inputClass}`} />
        </label>
      )}
    </>
  )
}

export default function AdminCourseContent() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [sectionTitle, setSectionTitle] = useState('')
  const [sectionEdit, setSectionEdit] = useState(null)
  const [lessonEditor, setLessonEditor] = useState(null)
  const [lessonForm, setLessonForm] = useState(emptyLessonForm)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [draggedSectionId, setDraggedSectionId] = useState(null)
  const [draggedLesson, setDraggedLesson] = useState(null)
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
    await saveLesson(section, null)
  }

  async function saveLesson(section, lessonId) {
    setSaving(true)
    setError('')
    setFeedback('')
    const payload = {
      sectionId: section.id,
      title: lessonForm.title.trim(),
      contentType: lessonForm.contentType,
      contentUrl: lessonForm.contentType === 'TEXT' ? null : lessonForm.contentUrl.trim(),
      bodyText: lessonForm.contentType === 'TEXT' ? lessonForm.bodyText.trim() : null,
      duration: lessonForm.duration === '' ? null : Number(lessonForm.duration),
      sortOrder: lessonId
        ? section.lessons.find((lesson) => lesson.id === lessonId).sortOrder
        : section.lessons.length,
    }
    try {
      if (lessonId) await updateLesson(lessonId, payload)
      else await createLesson(payload)
      setLessonEditor(null)
      setLessonForm(emptyLessonForm)
      setFeedback(lessonId ? 'Lesson updated.' : 'Lesson added.')
      await loadCourse()
    } catch (saveError) {
      setError(messageFor(saveError, `Lesson could not be ${lessonId ? 'updated' : 'added'}. Please try again.`))
    } finally {
      setSaving(false)
    }
  }

  function startEditLesson(section, lesson) {
    setLessonForm({
      title: lesson.title,
      contentType: lesson.contentType,
      contentUrl: lesson.contentUrl || '',
      bodyText: lesson.bodyText || '',
      duration: lesson.duration ?? '',
    })
    setLessonEditor({ sectionId: section.id, lessonId: lesson.id })
  }

  async function handleEditSection(event, section) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      await updateSection(section.id, {
        courseId: Number(courseId),
        title: sectionEdit.title.trim(),
        sortOrder: section.sortOrder,
      })
      setSectionEdit(null)
      setFeedback('Section updated.')
      await loadCourse()
    } catch (saveError) {
      setError(messageFor(saveError, 'Section could not be updated. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDropSection(event, targetSectionId) {
    event.preventDefault()
    const sourceSectionId = draggedSectionId
    setDraggedSectionId(null)
    if (!sourceSectionId || sourceSectionId === targetSectionId || saving) return
    const reordered = moveItem(
      sections,
      sections.findIndex((section) => section.id === sourceSectionId),
      sections.findIndex((section) => section.id === targetSectionId),
    )
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      setSections(await reorderSections(Number(courseId), reordered.map((section) => section.id)))
      setFeedback('Section order saved.')
    } catch (saveError) {
      setError(messageFor(saveError, 'Section order could not be saved. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDropLesson(event, targetSection, targetLessonId) {
    const source = draggedLesson
    if (!source) return
    event.preventDefault()
    event.stopPropagation()
    setDraggedLesson(null)
    if (!source || source.sectionId !== targetSection.id || source.lessonId === targetLessonId || saving) return
    const lessons = targetSection.lessons
    const reordered = moveItem(
      lessons,
      lessons.findIndex((lesson) => lesson.id === source.lessonId),
      lessons.findIndex((lesson) => lesson.id === targetLessonId),
    )
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      const savedLessons = await reorderLessons(targetSection.id, reordered.map((lesson) => lesson.id))
      setSections((current) => current.map((section) => section.id === targetSection.id
        ? { ...section, lessons: savedLessons }
        : section))
      setFeedback('Lesson order saved.')
    } catch (saveError) {
      setError(messageFor(saveError, 'Lesson order could not be saved. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!itemToDelete || saving) return
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      if (itemToDelete.type === 'section') await deleteSection(itemToDelete.item.id)
      else await deleteLesson(itemToDelete.item.id)
      setItemToDelete(null)
      setFeedback(itemToDelete.type === 'section' ? 'Section and its lessons deleted.' : 'Lesson deleted.')
      await loadCourse()
    } catch (deleteError) {
      setError(messageFor(deleteError, `${itemToDelete.type === 'section' ? 'Section' : 'Lesson'} could not be deleted. Please try again.`))
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
            <p className="mt-3 text-sm text-[#657570]">Drag sections or lessons to reorder them.</p>
            <form onSubmit={handleAddSection} className="mt-5 flex flex-col gap-3 border-y border-[#cbd3ca] bg-white p-4 sm:flex-row">
              <label className="sr-only" htmlFor="new-section-title">New section title</label>
              <input id="new-section-title" required value={sectionTitle} onChange={(event) => setSectionTitle(event.target.value)} placeholder="New section title" className={inputClass} />
              <button disabled={saving} className="shrink-0 bg-[#254d40] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#18392f] disabled:opacity-60">{saving ? 'Saving...' : 'Add section'}</button>
            </form>
            {feedback && <p role="status" className="mt-4 border-l-4 border-[#426e5c] bg-[#edf4ef] px-4 py-3 text-sm">{feedback}</p>}
            {error && <p role="alert" className="mt-4 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
            {sections.length === 0 && <p className="py-10 text-sm text-[#657570]">No sections yet. Add a section to start building this course.</p>}
            <div className="mt-6 space-y-5">
              {sections.map((section, sectionIndex) => (
                <section
                  key={section.id}
                  draggable={!saving}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', String(section.id))
                    setDraggedSectionId(section.id)
                  }}
                  onDragEnd={() => setDraggedSectionId(null)}
                  onDragOver={(event) => { if (draggedSectionId) event.preventDefault() }}
                  onDrop={(event) => handleDropSection(event, section.id)}
                  className={`border bg-white transition-colors ${draggedSectionId === section.id ? 'border-dashed border-[#426e5c] opacity-60' : 'border-[#d9ded5]'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9ded5] bg-[#e8ede6] px-4 py-4">
                    {sectionEdit?.id === section.id ? (
                      <form onSubmit={(event) => handleEditSection(event, section)} className="flex min-w-0 flex-1 gap-2">
                        <label className="sr-only" htmlFor={`section-${section.id}-title`}>Section title</label>
                        <input id={`section-${section.id}-title`} autoFocus required value={sectionEdit.title} onChange={(event) => setSectionEdit({ ...sectionEdit, title: event.target.value })} className={inputClass} />
                        <button disabled={saving} className="bg-[#254d40] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">Save</button>
                        <button type="button" className={buttonClass} onClick={() => setSectionEdit(null)}>Cancel</button>
                      </form>
                    ) : (
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden="true" className="cursor-grab text-lg text-[#68817b]" title="Drag to reorder">⠿</span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#68817b]">Section {sectionIndex + 1}</p>
                          <h2 className="mt-1 font-serif text-xl">{section.title}</h2>
                        </div>
                      </div>
                    )}
                    {sectionEdit?.id !== section.id && (
                      <div className="flex gap-2">
                        <button type="button" className={buttonClass} disabled={saving} onClick={() => setSectionEdit({ id: section.id, title: section.title })}>Edit</button>
                        <button type="button" className={`${buttonClass} text-[#a14935]`} disabled={saving} onClick={() => setItemToDelete({ type: 'section', item: section })}>Delete</button>
                        <button type="button" className="bg-[#254d40] px-3 py-2 text-xs font-semibold text-white hover:bg-[#18392f]" disabled={saving} onClick={() => {
                          setLessonEditor(lessonEditor?.sectionId === section.id && !lessonEditor.lessonId ? null : { sectionId: section.id, lessonId: null })
                          setLessonForm(emptyLessonForm)
                        }}>Add lesson</button>
                      </div>
                    )}
                  </div>
                  <ol className="divide-y divide-[#edf0e9]">
                    {section.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        draggable={!saving && lessonEditor?.lessonId !== lesson.id}
                        onDragStart={(event) => {
                          event.stopPropagation()
                          event.dataTransfer.setData('text/plain', String(lesson.id))
                          setDraggedLesson({ sectionId: section.id, lessonId: lesson.id })
                        }}
                        onDragEnd={() => setDraggedLesson(null)}
                        onDragOver={(event) => {
                          if (draggedLesson?.sectionId === section.id) {
                            event.preventDefault()
                            event.stopPropagation()
                          }
                        }}
                        onDrop={(event) => handleDropLesson(event, section, lesson.id)}
                        className={`px-4 py-3 transition-colors ${draggedLesson?.lessonId === lesson.id ? 'bg-[#edf4ef] opacity-60' : ''}`}
                      >
                        {lessonEditor?.lessonId === lesson.id ? (
                          <form onSubmit={(event) => { event.preventDefault(); saveLesson(section, lesson.id) }} className="space-y-3 bg-[#fbfcf8]">
                            <LessonFields form={lessonForm} setForm={setLessonForm} idPrefix={`edit-lesson-${lesson.id}`} />
                            <div className="flex justify-end gap-2">
                              <button type="button" className={buttonClass} onClick={() => { setLessonEditor(null); setLessonForm(emptyLessonForm) }}>Cancel</button>
                              <button disabled={saving} className="bg-[#254d40] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save lesson'}</button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span aria-hidden="true" className="cursor-grab text-lg text-[#68817b]" title="Drag to reorder">⠿</span>
                              <div>
                                <p className="font-semibold">{lesson.title}</p>
                                <p className="mt-1 text-xs uppercase tracking-wide text-[#68817b]">{lesson.contentType}{lesson.duration ? ` · ${lesson.duration} min` : ''}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" className={buttonClass} disabled={saving} onClick={() => startEditLesson(section, lesson)}>Edit</button>
                              <button type="button" className={`${buttonClass} text-[#a14935]`} disabled={saving} onClick={() => setItemToDelete({ type: 'lesson', item: lesson })}>Delete</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                    {section.lessons.length === 0 && <li className="px-4 py-4 text-sm text-[#657570]">No lessons in this section yet.</li>}
                  </ol>
                  {lessonEditor?.sectionId === section.id && !lessonEditor.lessonId && (
                    <form onSubmit={(event) => handleAddLesson(event, section)} className="space-y-3 border-t border-[#d9ded5] bg-[#fbfcf8] p-4">
                      <h3 className="font-semibold">Add lesson to {section.title}</h3>
                      <LessonFields form={lessonForm} setForm={setLessonForm} idPrefix={`new-lesson-${section.id}`} />
                      <div className="flex justify-end gap-2">
                        <button type="button" className={buttonClass} onClick={() => { setLessonEditor(null); setLessonForm(emptyLessonForm) }}>Cancel</button>
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
      {itemToDelete && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#172d2a]/55 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-content-title" aria-describedby="delete-content-description" className="w-full max-w-md bg-[#fbfcf8] p-6 shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a14935]">Course content</p>
            <h2 id="delete-content-title" className="mt-2 font-serif text-3xl">Delete {itemToDelete.type}?</h2>
            <p id="delete-content-description" className="mt-4 text-sm leading-6 text-[#657570]">
              {itemToDelete.type === 'section'
                ? `Delete "${itemToDelete.item.title}" and all of its lessons? This also removes progress recorded for those lessons.`
                : `Delete "${itemToDelete.item.title}"? Student progress recorded for this lesson will also be removed.`}
            </p>
            {error && <p role="alert" className="mt-4 border-l-4 border-[#bd4c37] bg-[#f8e9e4] px-3 py-2 text-sm">{error}</p>}
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setItemToDelete(null)} disabled={saving} className={buttonClass}>Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={saving} className="bg-[#a14935] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#853b2a] disabled:cursor-wait disabled:opacity-60">{saving ? 'Deleting...' : 'Delete permanently'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
