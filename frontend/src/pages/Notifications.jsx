import { useState } from 'react'
import { useNotifications } from '../context/useNotifications.js'

function formatNotificationDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function Notifications() {
  const [actionError, setActionError] = useState('')
  const {
    notifications,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    dismissNotification,
  } = useNotifications()

  async function handleMarkAsRead(notificationId) {
    setActionError('')
    try {
      await markAsRead(notificationId)
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'This notification could not be marked as read.')
    }
  }

  async function handleDismiss(notificationId) {
    setActionError('')
    try {
      await dismissNotification(notificationId)
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'This notification could not be dismissed.')
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Your updates</p>
            <h1 className="mt-3 font-serif text-4xl">Notifications</h1>
            <p className="mt-3 text-[#657570]">Enrollment confirmations and important course announcements.</p>
          </div>
          <button
            type="button"
            onClick={refreshNotifications}
            disabled={loading}
            className="border border-[#bdc9bf] px-4 py-2 text-sm font-semibold hover:bg-white disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <p role="alert" className="mt-6 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{error}</p>}
        {actionError && <p role="alert" className="mt-4 border-l-4 border-[#bd4c37] bg-white px-4 py-3 text-sm">{actionError}</p>}
        {loading && notifications.length === 0 && <p className="py-12 text-[#657570]">Loading notifications...</p>}
        {!loading && !error && notifications.length === 0 && (
          <div className="mt-8 border-y border-[#cbd3ca] py-8">
            <p className="text-[#657570]">You don’t have any notifications yet.</p>
          </div>
        )}
        {notifications.length > 0 && (
          <ul className="mt-8 divide-y divide-[#d9ded5] border-y border-[#cbd3ca]">
            {notifications.map((notification) => (
              <li key={notification.id} className={`flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 ${notification.read ? 'bg-white' : 'bg-[#edf4ef]'}`}>
                <div className="flex min-w-0 gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.read ? 'bg-[#bdc9bf]' : 'bg-[#bd4c37]'}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-xl">{notification.title}</h2>
                      {!notification.read && <span className="border border-[#d7aaa0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#a14935]">Unread</span>}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#52645f]">{notification.message}</p>
                    <p className="mt-3 text-xs text-[#68817b]">{formatNotificationDate(notification.createdAt)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 pl-5 sm:pl-0">
                  {!notification.read && (
                    <button type="button" onClick={() => handleMarkAsRead(notification.id)} className="border border-[#bdc9bf] px-3 py-2 text-xs font-semibold hover:bg-white">
                      Mark as read
                    </button>
                  )}
                  <button type="button" onClick={() => handleDismiss(notification.id)} className="border border-[#d7aaa0] px-3 py-2 text-xs font-semibold text-[#a14935] hover:bg-[#f8e9e4]">
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
