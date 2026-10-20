import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { getMyEnrollments } from '../services/enrollmentService.js'
import { getActivityHeatmap, getDashboardStats } from '../services/dashboardService.js'

const intensityClasses = [
  'bg-[#e8ede6]',
  'bg-[#b6d2bd]',
  'bg-[#83b391]',
  'bg-[#538768]',
  'bg-[#254d40]',
]
const weeklyGoalMinutes = 120

function formatStudyTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours === 0) return `${remainingMinutes} min`
  if (remainingMinutes === 0) return `${hours} hr`
  return `${hours} hr ${remainingMinutes} min`
}

function dateLabel(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ActivityHeatmap({ days }) {
  const firstDayOffset = days.length
    ? new Date(`${days[0].date}T00:00:00Z`).getUTCDay()
    : 0
  const cells = [
    ...Array.from({ length: firstDayOffset }, (_, index) => ({ key: `empty-${index}`, empty: true })),
    ...days.map((day) => ({ ...day, key: day.date })),
  ]
  while (cells.length % 7 !== 0) cells.push({ key: `trailing-${cells.length}`, empty: true })
  const weekCount = cells.length / 7
  const monthLabels = []
  days.forEach((day, index) => {
    const date = new Date(`${day.date}T00:00:00Z`)
    if (index === 0 || date.getUTCDate() === 1) {
      monthLabels.push({
        label: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        column: Math.floor((index + firstDayOffset) / 7) + 1,
      })
    }
  })

  return (
    <div className="overflow-x-auto pb-2">
      <div className="w-max">
        <div
          className="mb-2 grid h-5 text-[11px] text-[#68817b]"
          style={{ gridTemplateColumns: `repeat(${weekCount}, 11px)`, columnGap: '3px' }}
          aria-hidden="true"
        >
          {monthLabels.map((month, index) => (
            <span key={`${month.label}-${index}`} style={{ gridColumn: month.column }}>{month.label}</span>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="grid grid-rows-7 gap-[3px] pt-0.5 text-[10px] text-[#68817b]" aria-hidden="true">
            <span />
            <span>Mon</span>
            <span />
            <span>Wed</span>
            <span />
            <span>Fri</span>
            <span />
          </div>
          <div
            className="grid grid-flow-col grid-rows-7 gap-[3px] auto-cols-[11px]"
            role="img"
            aria-label="Daily study activity over the last year"
          >
            {cells.map((day) => day.empty
              ? <span key={day.key} />
              : (
                <span
                  key={day.key}
                  title={`${dateLabel(day.date)}: ${day.minutesSpent} study minutes, ${day.lessonsCompletedCount} lessons completed`}
                  aria-label={`${dateLabel(day.date)}: ${day.activityCount} activity points`}
                  className={`h-[11px] w-[11px] rounded-[2px] ${intensityClasses[day.intensity] || intensityClasses[0]}`}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, detail, icon }) {
  return (
    <article className="flex min-h-36 items-start gap-4 border border-[#d9ded5] bg-white p-5 sm:p-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#edf4ef] text-xl text-[#254d40]" aria-hidden="true">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#68817b]">{label}</p>
        <p className="mt-2 font-serif text-2xl text-[#172d2a]">{value}</p>
        <p className="mt-1 text-sm text-[#657570]">{detail}</p>
      </div>
    </article>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [activityDays, setActivityDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const enrollments = await getMyEnrollments()
      const courseIds = enrollments.map((enrollment) => enrollment.courseId)
      const [dashboardStats, heatmap] = await Promise.all([
        getDashboardStats(courseIds),
        getActivityHeatmap(),
      ])
      setStats(dashboardStats)
      setActivityDays(Array.isArray(heatmap.days) ? heatmap.days : [])
    } catch {
      setError('Your learning dashboard could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const weeklyActivity = useMemo(() => {
    const recentDays = activityDays.slice(-7)
    return {
      days: recentDays,
      minutes: recentDays.reduce((total, day) => total + day.minutesSpent, 0),
      lessons: recentDays.reduce((total, day) => total + day.lessonsCompletedCount, 0),
    }
  }, [activityDays])
  const goalPercentage = Math.min(100, Math.round((weeklyActivity.minutes / weeklyGoalMinutes) * 100))
  const maxDayMinutes = Math.max(1, ...weeklyActivity.days.map((day) => day.minutesSpent))
  const courses = stats?.courseProgress || []

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Student space</p>
            <h1 className="mt-3 font-serif text-4xl">Welcome back, {user.name || 'Learner'}.</h1>
            <p className="mt-3 text-[#657570]">A little progress each day adds up. Here is your learning at a glance.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/courses" className="inline-flex bg-[#254d40] px-5 py-3 text-sm font-semibold text-white hover:bg-[#18392f]">Explore courses</Link>
            <Link to="/my-enrollments" className="inline-flex border border-[#bdc9bf] bg-white px-5 py-3 text-sm font-semibold hover:bg-[#edf4ef]">My enrollments</Link>
          </div>
        </div>

        {error && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-l-4 border-[#bd4c37] bg-white px-4 py-3" role="alert">
            <p className="text-sm">{error}</p>
            <button type="button" onClick={loadDashboard} className="text-sm font-semibold underline">Try again</button>
          </div>
        )}

        {loading ? (
          <p className="mt-10 bg-white px-5 py-8 text-[#657570]" role="status">Loading your learning dashboard...</p>
        ) : !error && stats && (
          <>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              <SummaryCard
                label="Learning streak"
                value={`${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'} 🔥`}
                detail={stats.currentStreak ? 'Keep showing up and your streak will grow.' : 'Complete a lesson today to start a streak.'}
                icon="🔥"
              />
              <SummaryCard
                label="Total study time"
                value={formatStudyTime(stats.totalStudyMinutes)}
                detail="Time spent learning in your lessons."
                icon="◷"
              />
              <SummaryCard
                label="Active courses"
                value={stats.activeCourseCount}
                detail={`${courses.length} ${courses.length === 1 ? 'course enrolled' : 'courses enrolled'}`}
                icon="▤"
              />
            </div>

            <section className="mt-8 border border-[#d9ded5] bg-white p-5 sm:p-7" aria-labelledby="activity-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#68817b]">Your consistency</p>
                  <h2 id="activity-title" className="mt-1 font-serif text-2xl">Daily activity</h2>
                </div>
                <p className="text-sm text-[#657570]">Last 365 days</p>
              </div>
              <div className="mt-6">
                <ActivityHeatmap days={activityDays} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#657570]">
                <span>Each square shows your study time and completed lessons.</span>
                <div className="flex items-center gap-1.5" aria-label="Activity intensity: low to high">
                  <span>Less</span>
                  {intensityClasses.map((color) => <span key={color} className={`h-3 w-3 rounded-[2px] ${color}`} />)}
                  <span>More</span>
                </div>
              </div>
            </section>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
              <section aria-labelledby="courses-title">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#68817b]">Pick up where you left off</p>
                    <h2 id="courses-title" className="mt-1 font-serif text-2xl">Continue learning</h2>
                  </div>
                  <Link to="/my-enrollments" className="text-sm font-semibold text-[#254d40] underline">All courses</Link>
                </div>
                <div className="mt-4 space-y-3">
                  {courses.length === 0 ? (
                    <div className="border border-[#d9ded5] bg-white p-6">
                      <p className="font-semibold">No courses yet</p>
                      <p className="mt-1 text-sm text-[#657570]">Explore the catalog and enroll in a course to start learning.</p>
                      <Link to="/courses" className="mt-4 inline-flex bg-[#254d40] px-4 py-2.5 text-sm font-semibold text-white">Browse courses</Link>
                    </div>
                  ) : courses.map((course) => (
                    <article key={course.courseId} className="border border-[#d9ded5] bg-white p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-serif text-xl">{course.courseTitle}</h3>
                          <p className="mt-1 text-sm text-[#657570]">{course.completionPercentage}% complete</p>
                        </div>
                        <Link
                          to={`/courses/${course.courseId}/player`}
                          className="inline-flex shrink-0 items-center border border-[#bdc9bf] px-4 py-2 text-sm font-semibold hover:bg-[#edf4ef]"
                        >
                          {course.completionPercentage === 100 ? 'Review' : 'Resume'} <span className="ml-2" aria-hidden="true">→</span>
                        </Link>
                      </div>
                      <div
                        className="mt-4 h-2 overflow-hidden bg-[#e8ede6]"
                        role="progressbar"
                        aria-label={`${course.courseTitle} progress`}
                        aria-valuenow={course.completionPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="h-full bg-[#426e5c] transition-all" style={{ width: `${course.completionPercentage}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="space-y-5">
                <section className="border border-[#d9ded5] bg-white p-5 sm:p-6" aria-labelledby="weekly-title">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#68817b]">A goal to keep you moving</p>
                  <h2 id="weekly-title" className="mt-1 font-serif text-2xl">This week</h2>
                  <p className="mt-4 text-sm text-[#657570]">{formatStudyTime(weeklyActivity.minutes)} of {formatStudyTime(weeklyGoalMinutes)} study goal</p>
                  <div className="mt-2 h-2 overflow-hidden bg-[#e8ede6]" role="progressbar" aria-label="Weekly study goal" aria-valuenow={goalPercentage} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-[#426e5c] transition-all" style={{ width: `${goalPercentage}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-[#68817b]">{goalPercentage >= 100 ? 'Weekly goal reached — excellent work!' : `${weeklyGoalMinutes - weeklyActivity.minutes} minutes to reach your goal`}</p>
                  <div className="mt-5 flex h-24 items-end justify-between gap-2">
                    {weeklyActivity.days.map((day) => {
                      const height = day.minutesSpent ? Math.max(12, (day.minutesSpent / maxDayMinutes) * 88) : 4
                      return (
                        <div key={day.date} className="flex flex-1 flex-col items-center gap-2" title={`${dateLabel(day.date)}: ${day.minutesSpent} study minutes`}>
                          <div className="flex h-[88px] w-full items-end">
                            <span className="w-full bg-[#538768]" style={{ height: `${height}px`, opacity: day.minutesSpent ? 1 : 0.2 }} />
                          </div>
                          <span className="text-[10px] text-[#68817b]">
                            {new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </section>
                <section className="border border-[#d9ded5] bg-[#edf4ef] p-5 sm:p-6" aria-labelledby="milestones-title">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#68817b]">Recent milestones</p>
                  <h2 id="milestones-title" className="mt-1 font-serif text-2xl">Nice work</h2>
                  <ul className="mt-4 space-y-3 text-sm text-[#40534d]">
                    <li>{weeklyActivity.lessons > 0 ? `✓ ${weeklyActivity.lessons} ${weeklyActivity.lessons === 1 ? 'lesson' : 'lessons'} completed this week` : '○ Your next lesson completion will show here'}</li>
                    <li>{weeklyActivity.minutes > 0 ? `✓ ${formatStudyTime(weeklyActivity.minutes)} of learning time this week` : '○ Spend some time in a lesson to begin your weekly goal'}</li>
                    <li>{stats.currentStreak > 0 ? `🔥 You are on a ${stats.currentStreak}-day learning streak` : '○ Start learning today to build your streak'}</li>
                  </ul>
                </section>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
