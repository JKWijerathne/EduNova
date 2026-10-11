import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getCourse } from '../services/courseService.js'
import { getMyEnrollments } from '../services/enrollmentService.js'
import { completeLesson, getCourseCurriculum, getCourseProgress } from '../services/learningService.js'

function flattenLessons(sections) {
  return sections.flatMap((section) => section.lessons.map((lesson) => ({ ...lesson, sectionTitle: section.title })))
}

function embedUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`
    if (parsed.hostname.endsWith('youtube.com') && parsed.pathname === '/watch') {
      const videoId = parsed.searchParams.get('v')
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : url
    }
    if (parsed.hostname.endsWith('youtube.com') && parsed.pathname.startsWith('/embed/')) return url
    if (parsed.hostname.endsWith('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).at(-1)
      return id ? `https://player.vimeo.com/video/${id}` : url
    }
    return url
  } catch {
    return url
  }
}

export default function CoursePlayer() {
  const { courseId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [completedIds, setCompletedIds] = useState([])
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notEnrolled, setNotEnrolled] = useState(false)

  const lessons = useMemo(() => flattenLessons(sections), [sections])
  const activeLesson = lessons.find((lesson) => String(lesson.id) === String(activeLessonId))
  const activeIndex = lessons.findIndex((lesson) => String(lesson.id) === String(activeLessonId))
  const nextLesson = activeIndex >= 0 ? lessons[activeIndex + 1] : null
  const completionPercentage = lessons.length === 0
    ? 0
    : Math.floor(completedIds.length * 100 / lessons.length)
  const isCompleted = activeLesson && completedIds.includes(activeLesson.id)

  const loadLearningData = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const enrollments = await getMyEnrollments()
      if (!enrollments.some((enrollment) => String(enrollment.courseId) === String(courseId))) {
        setNotEnrolled(true)
        return
      }
      const [courseData, curriculum, progress] = await Promise.all([
        getCourse(courseId),
        getCourseCurriculum(courseId),
        getCourseProgress(courseId),
      ])
      setCourse(courseData)
      setSections(Array.isArray(curriculum) ? curriculum : [])
      setCompletedIds(Array.isArray(progress.completedLessonIds) ? progress.completedLessonIds : [])
    } catch {
      setError('The course player could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { loadLearningData() }, [loadLearningData])

  useEffect(() => {
    if (lessons.length === 0) return
    const requestedId = searchParams.get('lesson')
    const requestedLesson = lessons.find((lesson) => String(lesson.id) === requestedId)
    const firstIncomplete = lessons.find((lesson) => !completedIds.includes(lesson.id))
    const initialLesson = requestedLesson || firstIncomplete || lessons[0]
    setActiveLessonId((current) => requestedLesson
      ? requestedLesson.id
      : lessons.some((lesson) => String(lesson.id) === String(current))
        ? current
        : initialLesson.id)
  }, [completedIds, lessons, searchParams])

  function selectLesson(lessonId) {
    setActiveLessonId(lessonId)
    setSearchParams({ lesson: String(lessonId) }, { replace: true })
  }

  async function advanceLesson() {
    if (!activeLesson) return
    setError('')
    if (!isCompleted) {
      setSaving(true)
      try {
        await completeLesson(activeLesson.id)
        setCompletedIds((current) => current.includes(activeLesson.id) ? current : [...current, activeLesson.id])
      } catch {
        setError('Your lesson progress could not be saved. Please try again.')
        setSaving(false)
        return
      }
      setSaving(false)
    }
    if (nextLesson) selectLesson(nextLesson.id)
  }

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      {loading && <p className="mx-auto max-w-6xl px-6 py-16 text-[#657570]">Loading course...</p>}
      {!loading && notEnrolled && (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-serif text-3xl">You are not enrolled in this course.</h1>
          <Link to={`/courses/${courseId}`} className="mt-5 inline-flex bg-[#254d40] px-5 py-3 text-sm font-semibold text-white">View course</Link>
        </section>
      )}
      {!loading && !notEnrolled && error && !course && (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <p role="alert" className="border-l-4 border-[#bd4c37] bg-white px-4 py-3">{error}</p>
          <button onClick={loadLearningData} className="mt-4 border border-[#bdc9bf] px-4 py-2 text-sm font-semibold">Try again</button>
        </section>
      )}
      {!loading && course && (
        <>
          <header className="border-b border-[#d9ded5] bg-white px-5 py-5 sm:px-8">
            <div className="mx-auto max-w-7xl">
              <Link to="/my-enrollments" className="text-xs font-semibold text-[#68817b] hover:text-[#254d40]">← My enrollments</Link>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#68817b]">Course player</p>
                  <h1 className="mt-1 font-serif text-2xl">{course.title}</h1>
                </div>
                <p className="text-sm font-semibold">{completionPercentage}% complete</p>
              </div>
              <div className="mt-4 h-2 overflow-hidden bg-[#e8ede6]" role="progressbar" aria-label="Course progress" aria-valuenow={completionPercentage} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-[#426e5c] transition-all" style={{ width: `${completionPercentage}%` }} />
              </div>
            </div>
          </header>
          <div className="mx-auto grid max-w-7xl lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="border-b border-[#d9ded5] bg-white p-4 lg:min-h-[calc(100vh-152px)] lg:border-r lg:border-b-0">
              <h2 className="px-2 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#68817b]">Course curriculum</h2>
              {sections.length === 0 && <p className="px-2 py-4 text-sm text-[#657570]">Course lessons will be added soon.</p>}
              <nav aria-label="Course lessons" className="mt-2 space-y-4">
                {sections.map((section, sectionIndex) => (
                  <div key={section.id}>
                    <h3 className="px-2 text-sm font-semibold">{sectionIndex + 1}. {section.title}</h3>
                    <ul className="mt-1 space-y-1">
                      {section.lessons.map((lesson) => {
                        const completed = completedIds.includes(lesson.id)
                        const active = String(lesson.id) === String(activeLessonId)
                        return (
                          <li key={lesson.id}>
                            <button type="button" onClick={() => selectLesson(lesson.id)} aria-current={active ? 'page' : undefined} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${active ? 'bg-[#edf4ef] font-semibold text-[#254d40]' : 'hover:bg-[#f3f4ed]'}`}>
                              <span aria-label={completed ? 'Completed' : 'Not completed'} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${completed ? 'border-[#426e5c] bg-[#426e5c] text-white' : 'border-[#bdc9bf] text-transparent'}`}>✓</span>
                              <span className="min-w-0 flex-1">{lesson.title}</span>
                              {lesson.duration > 0 && <span className="shrink-0 text-xs text-[#68817b]">{lesson.duration}m</span>}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>
            <section className="min-w-0 px-5 py-8 sm:px-8 lg:px-12">
              {error && <p role="alert" className="mb-5 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
              {!activeLesson && <div className="bg-white p-8"><h2 className="font-serif text-2xl">No lessons yet</h2><p className="mt-3 text-[#657570]">Your instructor has not published any lessons for this course.</p></div>}
              {activeLesson && (
                <article className="mx-auto max-w-4xl">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#68817b]">{activeLesson.sectionTitle} · {activeLesson.contentType}</p>
                  <h2 className="mt-2 font-serif text-3xl sm:text-4xl">{activeLesson.title}</h2>
                  <div className="mt-7 overflow-hidden bg-white">
                    {activeLesson.contentType === 'TEXT' && <div className="min-h-64 whitespace-pre-wrap px-6 py-8 text-base leading-8 text-[#40534d] sm:px-10">{activeLesson.bodyText}</div>}
                    {activeLesson.contentType === 'VIDEO' && (
                      <div className="aspect-video bg-[#172d2a]">
                        <iframe title={activeLesson.title} src={embedUrl(activeLesson.contentUrl)} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                      </div>
                    )}
                    {activeLesson.contentType === 'PDF' && (
                      <iframe title={activeLesson.title} src={activeLesson.contentUrl} className="h-[70vh] min-h-[420px] w-full" />
                    )}
                    {activeLesson.contentType === 'LINK' && (
                      <div className="flex min-h-64 flex-col items-start justify-center px-6 py-8 sm:px-10">
                        <p className="text-[#657570]">Open this lesson resource in a new tab.</p>
                        <a href={activeLesson.contentUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex bg-[#254d40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#18392f]">Open resource ↗</a>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#cbd3ca] pt-5">
                    <span className="text-sm text-[#68817b]">{isCompleted ? 'Lesson completed' : 'Mark this lesson complete to track your progress.'}</span>
                    <button type="button" onClick={advanceLesson} disabled={saving || (isCompleted && !nextLesson)} className="bg-[#254d40] px-6 py-3 text-sm font-semibold text-white hover:bg-[#18392f] disabled:cursor-default disabled:opacity-60">
                      {saving ? 'Saving progress...' : nextLesson ? (isCompleted ? 'Next lesson →' : 'Mark complete & continue →') : (isCompleted ? 'Course complete ✓' : 'Mark as complete')}
                    </button>
                  </div>
                </article>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  )
}
