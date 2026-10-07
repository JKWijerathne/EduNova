import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { getCourse } from '../services/courseService.js'
import { enrollInCourse, getMyEnrollments } from '../services/enrollmentService.js'
import { useNotifications } from '../context/useNotifications.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return 'Price not set'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price))
}

export default function CourseDetails() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const { refreshNotifications } = useNotifications()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollmentFeedback, setEnrollmentFeedback] = useState('')

  useEffect(() => {
    let active = true
    getCourse(courseId)
      .then((result) => { if (active) setCourse(result) })
      .catch(() => { if (active) setError('This course could not be found.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId])

  useEffect(() => {
    if (user?.role !== 'STUDENT') {
      setCheckingEnrollment(false)
      return undefined
    }

    let active = true
    getMyEnrollments()
      .then((enrollments) => {
        if (active) setIsEnrolled(enrollments.some((item) => String(item.courseId) === String(courseId)))
      })
      .catch(() => {})
      .finally(() => { if (active) setCheckingEnrollment(false) })
    return () => { active = false }
  }, [courseId, user?.role])

  async function handleEnroll() {
    setEnrolling(true)
    setEnrollmentFeedback('')
    try {
      await enrollInCourse(courseId)
      setIsEnrolled(true)
      setEnrollmentFeedback('You are enrolled in this course.')
      await refreshNotifications()
    } catch (enrollmentError) {
      if (enrollmentError.response?.status === 409) {
        setIsEnrolled(true)
        setEnrollmentFeedback('You are already enrolled in this course.')
      } else if (enrollmentError.response?.status === 401) {
        setEnrollmentFeedback('Your session has expired. Sign in again to enroll.')
      } else {
        setEnrollmentFeedback('Enrollment could not be completed. Please try again.')
      }
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f4ed] px-6 py-8 text-[#172d2a] sm:px-10">
      <div className="mx-auto max-w-4xl">
        {loading && <p className="py-16 text-[#657570]">Loading course...</p>}
        {error && <p role="alert" className="mt-8 border-l-4 border-[#bd4c37] bg-white px-4 py-3">{error}</p>}
        {course && !loading && (
          <article className="mt-8 border-t-4 border-[#426e5c] bg-white px-6 py-8 sm:px-10 sm:py-12">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-[#68817b]">
              <span>{course.category || 'Course'}</span>
              <span className="text-[#a14935]">{formatPrice(course.price)}</span>
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">{course.title}</h1>
            <p className="mt-5 text-sm text-[#657570]">{course.instructorName || 'Instructor to be announced'}{course.duration ? ` · ${course.duration}` : ''}</p>
            <div className="mt-10 border-t border-[#d9ded5] pt-8">
              <h2 className="font-serif text-2xl">About this course</h2>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-[#52645f]">{course.description || 'Course information will be added soon.'}</p>
            </div>
            {user?.role === 'STUDENT' && (
              <div className="mt-8 border-t border-[#d9ded5] pt-6">
                {enrollmentFeedback && <p role="status" className="mb-4 border-l-4 border-[#426e5c] bg-[#edf4ef] px-4 py-3 text-sm">{enrollmentFeedback}{isEnrolled && <Link to="/my-enrollments" className="ml-2 font-semibold underline">View my enrollments</Link>}</p>}
                <button onClick={handleEnroll} disabled={isEnrolled || checkingEnrollment || enrolling} className="bg-[#254d40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#18392f] disabled:cursor-default disabled:opacity-60">{enrolling ? 'Enrolling...' : isEnrolled ? 'Already enrolled' : checkingEnrollment ? 'Checking enrollment...' : 'Enroll Now'}</button>
              </div>
            )}
          </article>
        )}
      </div>
    </main>
  )
}
