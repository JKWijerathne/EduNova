import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses } from '../services/courseService.js'
import { getAllEnrollments } from '../services/enrollmentService.js'

function formatDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [coursesById, setCoursesById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a14935]">Administration</p>
        <h1 className="mt-3 font-serif text-4xl">Enrollment overview</h1>
        <p className="mt-3 text-[#657570]">Student registrations across the platform.</p>
        {error && <p role="alert" className="mt-6 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
        <div className="mt-8 overflow-x-auto border-y border-[#cbd3ca]">
          {loading ? <p className="py-8 text-[#657570]">Loading enrollments...</p> : enrollments.length === 0 ? (
            <p className="py-8 text-[#657570]">No course enrollments yet.</p>
          ) : (
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-[#e8ede6] text-xs uppercase tracking-[0.12em] text-[#52645f]">
                <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Enrolled</th><th className="px-4 py-3">Status</th></tr>
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  )
}
