import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CourseForm from '../components/CourseForm.jsx'
import { useAuth } from '../context/useAuth.js'
import { createCourse, deleteCourse, getCourses, updateCourse } from '../services/courseService.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return 'Not set'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price))
}

export default function AdminCourses() {
  const { logout } = useAuth()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseToDelete, setCourseToDelete] = useState(null)
  const [deletingCourseId, setDeletingCourseId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCourses = useCallback(async () => {
    setError('')
    try {
      const results = await getCourses()
      setCourses(Array.isArray(results) ? results : [])
    } catch {
      setError('Courses could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCourses() }, [loadCourses])

  async function saveCourse(values) {
    if (selectedCourse) await updateCourse(selectedCourse.id, values)
    else await createCourse(values)
    await loadCourses()
  }

  function openDelete(course) {
    setCourseToDelete(course)
    setDeleteError('')
  }

  function closeDelete() {
    if (deletingCourseId !== null) return
    setCourseToDelete(null)
    setDeleteError('')
  }

  async function confirmDelete() {
    if (!courseToDelete || deletingCourseId !== null) return
    const course = courseToDelete
    setDeletingCourseId(course.id)
    setDeleteError('')
    try {
      await deleteCourse(course.id)
      setCourseToDelete(null)
      await loadCourses()
    } catch {
      setDeleteError('Course could not be deleted. Please try again.')
    } finally {
      setDeletingCourseId(null)
    }
  }

  function openCreate() {
    setSelectedCourse(null)
    setFormOpen(true)
  }

  function openEdit(course) {
    setSelectedCourse(course)
    setFormOpen(true)
  }

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d9ded5] bg-white px-6 py-5 sm:px-10">
        <Link to="/admin-dashboard" className="text-xl font-bold tracking-tight">EduNova<span className="text-[#bd4c37]">.</span></Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link to="/courses" className="hover:text-[#bd4c37]">Catalog</Link>
          <button onClick={logout} className="border border-[#bdc9bf] px-4 py-2 hover:bg-[#edf4ef]">Sign out</button>
        </nav>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a14935]">Administration</p>
            <h1 className="mt-3 font-serif text-4xl">Course management</h1>
            <p className="mt-3 text-[#657570]">Create, update, and remove catalog courses.</p>
          </div>
          <button onClick={openCreate} className="bg-[#254d40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#18392f]">+ Add course</button>
        </div>

        {error && <p role="alert" className="mt-6 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
        <div className="mt-8 overflow-x-auto border-y border-[#cbd3ca]">
          {loading ? <p className="py-8 text-[#657570]">Loading courses...</p> : courses.length === 0 ? (
            <p className="py-8 text-[#657570]">No courses yet. Add the first course to the catalog.</p>
          ) : (
            <table className="w-full min-w-[740px] border-collapse text-left text-sm">
              <thead className="bg-[#e8ede6] text-xs uppercase tracking-[0.12em] text-[#52645f]">
                <tr><th className="px-4 py-3">Course</th><th className="px-4 py-3">Instructor</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-t border-[#d9ded5] bg-white">
                    <td className="px-4 py-4"><Link to={`/courses/${course.id}`} className="font-semibold hover:text-[#426e5c]">{course.title}</Link>{course.duration && <span className="mt-1 block text-xs text-[#68817b]">{course.duration}</span>}</td>
                    <td className="px-4 py-4 text-[#52645f]">{course.instructorName || '—'}</td>
                    <td className="px-4 py-4 text-[#52645f]">{course.category || '—'}</td>
                    <td className="px-4 py-4 text-[#52645f]">{formatPrice(course.price)}</td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(course)} className="border border-[#bdc9bf] px-3 py-2 text-xs font-semibold hover:bg-[#edf4ef]">Edit</button><button onClick={() => openDelete(course)} disabled={deletingCourseId === course.id} className="border border-[#d7aaa0] px-3 py-2 text-xs font-semibold text-[#a14935] hover:bg-[#f8e9e4] disabled:cursor-wait disabled:opacity-60">{deletingCourseId === course.id ? 'Deleting...' : 'Delete'}</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      {formOpen && <CourseForm course={selectedCourse} onClose={() => setFormOpen(false)} onSave={saveCourse} />}
      {courseToDelete && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#172d2a]/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDelete() }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-course-title" aria-describedby="delete-course-description" className="w-full max-w-md border-t-4 border-[#bd4c37] bg-[#fbfcf8] p-6 shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a14935]">Course management</p>
            <h2 id="delete-course-title" className="mt-2 font-serif text-3xl">Delete Course</h2>
            <p id="delete-course-description" className="mt-4 leading-6 text-[#52645f]">Are you sure you want to delete "{courseToDelete.title}"?</p>
            {deleteError && <p role="alert" className="mt-4 border-l-4 border-[#bd4c37] bg-[#f8e9e4] px-3 py-2 text-sm">{deleteError}</p>}
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={closeDelete} disabled={deletingCourseId !== null} className="border border-[#bdc9bf] px-4 py-2.5 text-sm font-semibold hover:bg-[#edf4ef] disabled:opacity-60">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={deletingCourseId !== null} className="min-w-32 bg-[#a43f30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#843124] disabled:cursor-wait disabled:opacity-70">{deletingCourseId !== null ? 'Deleting...' : 'Delete course'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
