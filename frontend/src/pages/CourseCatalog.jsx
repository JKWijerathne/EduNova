import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses } from '../services/courseService.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return 'Price not set'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price))
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getCourses()
      .then((results) => {
        if (active) setCourses(Array.isArray(results) ? results : [])
      })
      .catch(() => {
        if (active) setError('Courses could not be loaded. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const categories = useMemo(
    () => [...new Set(courses.map((course) => course.category).filter(Boolean))].sort(),
    [courses],
  )
  const visibleCourses = courses.filter((course) => {
    const searchable = `${course.title || ''} ${course.description || ''} ${course.instructorName || ''}`.toLowerCase()
    return searchable.includes(query.toLowerCase()) && (category === 'all' || course.category === category)
  })

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Learn at your pace</p>
            <h1 className="mt-3 font-serif text-4xl">Course catalog</h1>
            <p className="mt-3 max-w-xl text-[#657570]">Explore courses built to take your next skill further.</p>
          </div>
          <p className="text-sm font-semibold text-[#68817b]">{visibleCourses.length} courses</p>
        </div>

        <div className="mt-8 grid gap-3 border-y border-[#cbd3ca] py-4 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="sr-only" htmlFor="course-search">Search courses</label>
          <input id="course-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, topic, or instructor" className="min-w-0 border border-[#bdc9bf] bg-white px-4 py-3 outline-none focus:border-[#426e5c]" />
          <label className="sr-only" htmlFor="course-category">Filter by category</label>
          <select id="course-category" value={category} onChange={(event) => setCategory(event.target.value)} className="border border-[#bdc9bf] bg-white px-4 py-3 outline-none focus:border-[#426e5c]">
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {error && <p role="alert" className="mt-8 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
        {loading && <p className="py-12 text-[#657570]">Loading courses...</p>}
        {!loading && !error && visibleCourses.length === 0 && (
          <p className="py-14 text-[#657570]">{courses.length ? 'No courses match your search.' : 'No courses are available yet.'}</p>
        )}
        {!loading && !error && visibleCourses.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`} className="group flex min-h-64 flex-col border border-[#d9ded5] bg-white p-6 transition-colors hover:border-[#426e5c]">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#68817b]">{course.category || 'Course'}</span>
                  <span className="text-sm font-semibold text-[#a14935]">{formatPrice(course.price)}</span>
                </div>
                <h2 className="mt-5 font-serif text-2xl group-hover:text-[#426e5c]">{course.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#657570]">{course.description || 'Explore the course details to learn more.'}</p>
                <div className="mt-auto flex justify-between gap-3 pt-6 text-sm text-[#68817b]">
                  <span>{course.instructorName || 'Instructor to be announced'}</span>
                  {course.duration && <span>{course.duration}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
