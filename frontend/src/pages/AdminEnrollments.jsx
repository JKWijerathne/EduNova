import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses } from '../services/courseService.js'
import { dropEnrollment, getAllEnrollments } from '../services/enrollmentService.js'

function formatDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [coursesById, setCoursesById] = useState({})
  const [enrollmentToRemove, setEnrollmentToRemove] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getAllEnrollments(), getCourses()])
      .then(([allEnrollments, courses]) => {
        if (!active) return
        setEnrollments(Array.isArray(allEnrollments) ? allEnrollments : [])
        setCoursesById(Object.fromEntries((Array.isArray(courses) ? courses : []).map((course) => [String(course.id), course])))
      })
      .catch(() => { if (active) setError('Enrollment data could not be loaded. Please try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function confirmUnenroll() {
    if (!enrollmentToRemove || removingId !== null) return
    const enrollment = enrollmentToRemove
    setRemovingId(enrollment.id)
    setError('')
    setFeedback('')
    try {
      await dropEnrollment(enrollment.id)
      setEnrollments((current) => current.filter((item) => item.id !== enrollment.id))
      setFeedback(`${enrollment.studentName || `Student #${enrollment.studentId}`} was unenrolled.`)
      setEnrollmentToRemove(null)
    } catch (requestError) {
      const reason = requestError.response?.data?.detail || requestError.response?.data?.message
      setError(reason || 'The student could not be unenrolled. Please try again.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a14935]">Administration</p>
        <h1 className="mt-3 font-serif text-4xl">Enrollment overview</h1>
        <p className="mt-3 text-[#657570]">Student registrations across the platform.</p>
        {feedback && <p role="status" className="mt-6 border-l-4 border-[#426e5c] bg-[#edf4ef] px-4 py-3 text-sm">{feedback}</p>}
        {error && <p role="alert" className="mt-6 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
        <div className="mt-8 overflow-x-auto border-y border-[#cbd3ca]">
          {loading ? <p className="py-8 text-[#657570]">Loading enrollments...</p> : enrollments.length === 0 ? (
            <p className="py-8 text-[#657570]">No course enrollments yet.</p>
          ) : (
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-[#e8ede6] text-xs uppercase tracking-[0.12em] text-[#52645f]">
                <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Enrolled</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => {
                  const course = coursesById[String(enrollment.courseId)]
                  return (
                    <tr key={enrollment.id} className="border-t border-[#d9ded5] bg-white">
                      <td className="px-4 py-4"><span className="font-semibold">{enrollment.studentName || `Student #${enrollment.studentId}`}</span><span className="mt-1 block text-xs text-[#68817b]">{enrollment.studentEmail || 'Email unavailable'}</span></td>
                      <td className="px-4 py-4">{course ? <Link to={`/courses/${course.id}`} className="font-semibold hover:text-[#426e5c]">{course.title}</Link> : `Course #${enrollment.courseId}`}</td>
                      <td className="px-4 py-4 text-[#52645f]">{formatDate(enrollment.enrolledAt)}</td>
                      <td className="px-4 py-4"><span className="border border-[#b8cdbf] bg-[#edf4ef] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[#426e5c]">Active</span></td>
                      <td className="px-4 py-4 text-right"><button type="button" onClick={() => setEnrollmentToRemove(enrollment)} disabled={removingId === enrollment.id} className="border border-[#d7aaa0] px-3 py-2 text-xs font-semibold text-[#a14935] hover:bg-[#f8e9e4] disabled:cursor-wait disabled:opacity-60">Unenroll</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
      {enrollmentToRemove && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#172d2a]/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && removingId === null) setEnrollmentToRemove(null) }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="unenroll-title" aria-describedby="unenroll-description" className="w-full max-w-md bg-[#fbfcf8] p-6 shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a14935]">Enrollment management</p>
            <h2 id="unenroll-title" className="mt-2 font-serif text-3xl">Unenroll student?</h2>
            <p id="unenroll-description" className="mt-4 text-sm leading-6 text-[#657570]">
              Remove {enrollmentToRemove.studentName || `Student #${enrollmentToRemove.studentId}`} from {coursesById[String(enrollmentToRemove.courseId)]?.title || `Course #${enrollmentToRemove.courseId}`}?
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setEnrollmentToRemove(null)} disabled={removingId !== null} className="border border-[#bdc9bf] px-4 py-2.5 text-sm font-semibold hover:bg-[#edf4ef] disabled:opacity-60">Cancel</button>
              <button type="button" onClick={confirmUnenroll} disabled={removingId !== null} className="bg-[#a14935] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#853b2a] disabled:cursor-wait disabled:opacity-60">{removingId !== null ? 'Unenrolling...' : 'Unenroll student'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
