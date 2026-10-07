import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../context/useNotifications.js'

function formatNotificationDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export default function NotificationBell() {
  const { notifications, loading, error, markAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const containerRef = useRef(null)
  const unreadCount = notifications.filter((notification) => !notification.read).length

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  async function handleNotificationClick(notification) {
    setActionError('')
    if (!notification.read) {
      try {
        await markAsRead(notification.id)
      } catch (requestError) {
        setActionError(requestError.response?.data?.message || 'This notification could not be marked as read.')
        return
      }
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex size-10 items-center justify-center border border-[#bdc9bf] text-[#254d40] hover:bg-[#edf4ef]"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#bd4c37] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          aria-label="Recent notifications"
          className="absolute right-0 z-20 mt-3 w-[min(22rem,calc(100vw-2rem))] border border-[#d9ded5] bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-[#d9ded5] px-4 py-3">
            <h2 className="font-serif text-lg">Notifications</h2>
            {unreadCount > 0 && <span className="text-xs font-semibold text-[#a14935]">{unreadCount} unread</span>}
          </div>
          {error && <p role="alert" className="px-4 py-4 text-sm text-[#a14935]">{error}</p>}
          {actionError && <p role="alert" className="px-4 py-3 text-sm text-[#a14935]">{actionError}</p>}
          {loading && <p className="px-4 py-4 text-sm text-[#657570]">Loading notifications...</p>}
          {!loading && !error && notifications.length === 0 && (
            <p className="px-4 py-5 text-sm text-[#657570]">You’re all caught up.</p>
          )}
          {!loading && notifications.length > 0 && (
            <ul className="max-h-80 divide-y divide-[#edf0e9] overflow-y-auto">
              {notifications.slice(0, 5).map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 text-left hover:bg-[#f6f8f3] ${notification.read ? '' : 'bg-[#edf4ef]'}`}
                  >
                    <span className="flex items-start gap-2">
                      {!notification.read && <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-[#bd4c37]" />}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#172d2a]">{notification.title}</span>
                        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[#657570]">{notification.message}</span>
                        <span className="mt-1 block text-[11px] text-[#68817b]">{formatNotificationDate(notification.createdAt)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[#d9ded5] px-4 py-3 text-sm font-semibold text-[#254d40] hover:bg-[#edf4ef]"
          >
            View all notifications
          </Link>
        </section>
      )}
    </div>
  )
}
