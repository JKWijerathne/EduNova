import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses } from '../services/courseService.js'
import { getMyEnrollments } from '../services/enrollmentService.js'
import { getCourseProgress } from '../services/learningService.js'

export default function MyLearning() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadLearning() {
      try {
        const enrollments = await getMyEnrollments()
        if (!Array.isArray(enrollments) || enrollments.length === 0) {
          if (active) setCourses([])
          return
        }

        const [allCourses, progressEntries] = await Promise.all([
          getCourses(),
          Promise.all(enrollments.map(async (enrollment) => ({
            courseId: String(enrollment.courseId),
            progress: await getCourseProgress(enrollment.courseId),
          }))),
        ])
        if (!active) return

        const coursesById = new Map((Array.isArray(allCourses) ? allCourses : []).map((course) => [String(course.id), course]))
        const progressByCourseId = new Map(progressEntries.map(({ courseId, progress }) => [courseId, progress]))
        setCourses(enrollments.map((enrollment) => ({
          enrollment,
          course: coursesById.get(String(enrollment.courseId)),
          progress: progressByCourseId.get(String(enrollment.courseId)),
        })))
      } catch {
        if (active) setError('Your learning progress could not be loaded. Please try again.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadLearning()
    return () => { active = false }
  }, [])

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Your progress</p>
        <h1 className="mt-3 font-serif text-4xl">My learning</h1>
        <p className="mt-3 text-[#657570]">Pick up where you left off in your enrolled courses.</p>
        {error && <p role="alert" className="mt-6 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
        {loading && <p role="status" className="py-12 text-[#657570]">Loading your learning progress...</p>}
        {!loading && !error && courses.length === 0 && (
          <div className="mt-8 border-y border-[#cbd3ca] py-8">
            <p className="text-[#657570]">You are not enrolled in any courses yet.</p>
            <Link to="/courses" className="mt-5 inline-flex bg-[#254d40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#18392f]">Explore courses</Link>
          </div>
        )}
        {!loading && courses.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {courses.map(({ enrollment, course, progress }) => {
              const percentage = Math.min(100, Math.max(0, Number(progress?.completionPercentage) || 0))
              const title = course?.title || `Course #${enrollment.courseId}`
              return (
                <article key={enrollment.id} className="border border-[#d9ded5] bg-white p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#68817b]">{course?.category || 'Enrolled course'}</p>
                  <h2 className="mt-3 font-serif text-2xl">{title}</h2>
                  <p className="mt-2 text-sm text-[#657570]">{course?.instructorName || 'Instructor unavailable'}</p>
                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-xs font-semibold">
                      <span>Course progress</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#e5ebe5]" role="progressbar" aria-label={`${title} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percentage}>
                      <div className="h-full rounded-full bg-[#426e5c] transition-[width]" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                  <Link to={`/courses/${enrollment.courseId}/player`} className="mt-6 inline-flex bg-[#254d40] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#18392f]">Continue learning</Link>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
