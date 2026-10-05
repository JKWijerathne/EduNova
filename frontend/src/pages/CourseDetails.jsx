import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse } from '../services/courseService.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return 'Price not set'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price))
}

export default function CourseDetails() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getCourse(courseId)
      .then((result) => { if (active) setCourse(result) })
      .catch(() => { if (active) setError('This course could not be found.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId])

  return (
    <main className="min-h-screen bg-[#f3f4ed] px-6 py-8 text-[#172d2a] sm:px-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/courses" className="text-sm font-semibold text-[#426e5c] hover:text-[#bd4c37]">← Course catalog</Link>
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
          </article>
        )}
      </div>
    </main>
  )
}
