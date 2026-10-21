import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

const studentSections = [
  {
    title: 'Learning',
    items: [
      { label: 'Dashboard', to: '/student-dashboard', icon: 'dashboard' },
      { label: 'Course Catalog', to: '/courses', icon: 'catalog' },
      { label: 'My Enrollments', to: '/my-enrollments', icon: 'enrollments' },
      { label: 'My Learning', to: '/my-learning', icon: 'learning' },
    ],
  },
  {
    title: 'Personal',
    items: [
      { label: 'Notifications', to: '/notifications', icon: 'notifications' },
      { label: 'Profile', to: '/profile', icon: 'profile' },
      { label: 'Settings', to: '/settings', icon: 'settings' },
    ],
  },
]

const adminSections = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin-dashboard', icon: 'dashboard' }],
  },
  {
    title: 'Management',
    items: [
      { label: 'Course Management', to: '/admin/courses', icon: 'catalog' },
      { label: 'User Management', to: '/admin/users', icon: 'users' },
      { label: 'Enrollment Management', to: '/admin/enrollments', icon: 'enrollments' },
      { label: 'Notification Management', to: '/admin/notifications', icon: 'notifications' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', to: '/profile', icon: 'profile' },
      { label: 'Settings', to: '/settings', icon: 'settings' },
    ],
  },
]

const instructorSections = [
  {
    title: 'Management',
    items: [
      { label: 'Course Management', to: '/admin/courses', icon: 'catalog' },
      { label: 'Course Catalog', to: '/courses', icon: 'learning' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', to: '/profile', icon: 'profile' },
      { label: 'Settings', to: '/settings', icon: 'settings' },
    ],
  },
]

const iconPaths = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  catalog: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
  enrollments: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2" /></>,
  learning: <><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 0 3 23z" /><path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5A2.5 2.5 0 0 1 21 23z" /></>,
  notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" transform="translate(-1 -1)" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3.5 3.5 0 0 1 0 6.8M17 14a5.5 5.5 0 0 1 4.5 5.5" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
}

function SidebarIcon({ name, className = 'size-5' }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name]}
    </svg>
  )
}

function isItemActive(pathname, item) {
  if (item.to === '/courses') {
    return pathname === '/courses'
      || (pathname.startsWith('/courses/') && !/^\/courses\/[^/]+\/player(?:\/|$)/.test(pathname))
  }
  if (item.to === '/my-learning') {
    return pathname === '/my-learning' || /^\/courses\/[^/]+\/player(?:\/|$)/.test(pathname)
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const sections = user.role === 'ADMIN'
    ? adminSections
    : user.role === 'INSTRUCTOR'
      ? instructorSections
      : studentSections
  const accountLabel = user.role === 'ADMIN' ? 'Administrator' : user.role === 'INSTRUCTOR' ? 'Instructor' : 'Student'

  function closeDrawer() {
    setDrawerOpen(false)
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-[#17372f] text-[#edf4ef]">
      <Link to={user.role === 'ADMIN' ? '/admin-dashboard' : user.role === 'INSTRUCTOR' ? '/admin/courses' : '/student-dashboard'} onClick={closeDrawer} className="flex h-20 shrink-0 items-center border-b border-white/10 px-6 text-2xl font-bold tracking-tight">
        EduNova<span className="text-[#e08b70]">.</span>
      </Link>
      <div className="border-b border-white/10 px-6 py-5">
        <p className="truncate text-sm font-semibold">{user.name || accountLabel}</p>
        <p className="mt-1 text-xs text-[#b5c8bf]">{accountLabel}</p>
      </div>
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#a9beb4]">{section.title}</h2>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isItemActive(location.pathname, item)
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={closeDrawer}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-[#eaf1eb] text-[#17372f]' : 'text-[#d6e2db] hover:bg-white/10 hover:text-white'}`}
                    >
                      <SidebarIcon name={item.icon} className="size-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[#d6e2db] hover:bg-white/10 hover:text-white">
          <SidebarIcon name="logout" className="size-[18px] shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f3f4ed] text-[#172d2a] lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 lg:block">
        {sidebar}
      </aside>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation menu" onClick={closeDrawer} className="absolute inset-0 bg-[#10241f]/55" />
          <aside className="relative h-full w-[min(20rem,85vw)] shadow-2xl">
            <button type="button" aria-label="Close navigation menu" onClick={closeDrawer} className="absolute right-3 top-5 z-10 rounded p-2 text-[#d6e2db] hover:bg-white/10">
              <SidebarIcon name="close" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#d9ded5] bg-[#fbfcf8] px-4 lg:hidden">
          <button type="button" aria-label="Open navigation menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)} className="rounded p-2 text-[#254d40] hover:bg-[#edf4ef]">
            <SidebarIcon name="menu" />
          </button>
          <span className="text-lg font-bold tracking-tight">EduNova<span className="text-[#bd4c37]">.</span></span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
