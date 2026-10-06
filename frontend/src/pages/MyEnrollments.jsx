import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses } from '../services/courseService.js'
import { dropEnrollment, getMyEnrollments } from '../services/enrollmentService.js'

function formatDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

export default function MyEnrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [coursesById, setCoursesById] = useState({})
  const [enrollmentToDrop, setEnrollmentToDrop] = useState(null)
  const [droppingId, setDroppingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getMyEnrollments(), getCourses()])
      .then(([myEnrollments, courses]) => {
        if (!active) return
        setEnrollments(Array.isArray(myEnrollments) ? myEnrollments : [])
        setCoursesById(Object.fromEntries((Array.isArray(courses) ? courses : []).map((course) => [String(course.id), course])))
      })
      .catch(() => { if (active) setError('Your enrollments could not be loaded. Please try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function confirmDrop() {
    if (!enrollmentToDrop) return
    const enrollment = enrollmentToDrop
    setDroppingId(enrollment.id)
    setError('')
    try {
      await dropEnrollment(enrollment.id)
      setEnrollments((current) => current.filter((item) => item.id !== enrollment.id))
    } catch {
      setError('This enrollment could not be cancelled. Please try again.')
    } finally {
      setDroppingId(null)
      setEnrollmentToDrop(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Student space</p>
        <h1 className="mt-3 font-serif text-4xl">My enrollments</h1>
        <p className="mt-3 text-[#657570]">Courses you are currently taking.</p>
        {error && <p role="alert" className="mt-6 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
        {loading && <p className="py-12 text-[#657570]">Loading enrollments...</p>}
        {!loading && !error && enrollments.length === 0 && (
          <div className="mt-8 border-y border-[#cbd3ca] py-8">
            <p className="text-[#657570]">You are not enrolled in any courses yet.</p>
            <Link to="/courses" className="mt-5 inline-flex bg-[#254d40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#18392f]">Explore courses</Link>
          </div>
        )}
        {!loading && enrollments.length > 0 && (
          <div className="mt-8 divide-y divide-[#d9ded5] border-y border-[#cbd3ca]">
            {enrollments.map((enrollment) => {
              const course = coursesById[String(enrollment.courseId)]
              return (
                <article key={enrollment.id} className="flex flex-col gap-5 bg-white px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      {course ? <Link to={`/courses/${course.id}`} className="font-serif text-2xl hover:text-[#426e5c]">{course.title}</Link> : <h2 className="font-serif text-2xl">Course #{enrollment.courseId}</h2>}
                      <span className="border border-[#b8cdbf] bg-[#edf4ef] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[#426e5c]">Active</span>
                    </div>
                    <p className="mt-2 text-sm text-[#657570]">{course?.instructorName || 'Instructor unavailable'}{course?.duration ? ` · ${course.duration}` : ''}</p>
                    <p className="mt-1 text-xs text-[#68817b]">Enrolled {formatDate(enrollment.enrolledAt)}</p>
                  </div>
                  <button onClick={() => setEnrollmentToDrop(enrollment)} disabled={droppingId === enrollment.id} className="self-start border border-[#d7aaa0] px-4 py-2 text-sm font-semibold text-[#a14935] hover:bg-[#f8e9e4] disabled:cursor-wait disabled:opacity-60 sm:self-center">Drop course</button>
                </article>
              )
            })}
          </div>
        )}
      </section>
      {enrollmentToDrop && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#172d2a]/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && droppingId === null) setEnrollmentToDrop(null) }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="drop-course-title" aria-describedby="drop-course-description" className="my-auto w-full max-w-md bg-[#fbfcf8] p-6 shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a14935]">Confirm course drop</p>
            <h2 id="drop-course-title" className="mt-2 font-serif text-3xl">Drop this course?</h2>
            <p id="drop-course-description" className="mt-4 text-sm leading-6 text-[#657570]">Are you sure you want to drop <span className="font-semibold text-[#172d2a]">{coursesById[String(enrollmentToDrop.courseId)]?.title || `Course #${enrollmentToDrop.courseId}`}</span>? You will be removed from this course.</p>
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setEnrollmentToDrop(null)} disabled={droppingId !== null} className="border border-[#bdc9bf] px-4 py-2.5 text-sm font-semibold hover:bg-[#edf4ef] disabled:opacity-60">Keep course</button>
              <button type="button" onClick={confirmDrop} disabled={droppingId !== null} className="bg-[#a14935] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#853b2a] disabled:cursor-wait disabled:opacity-60">{droppingId !== null ? 'Dropping...' : 'Drop course'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
