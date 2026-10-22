import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { changeMyPassword, getMyProfile, updateMyProfile } from '../services/profileService.js'

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : parts[0]?.slice(0, 2) || 'EN').toUpperCase()
}

function requestMessage(error, fallback) {
  return error.response?.data?.detail
    || error.response?.data?.message
    || fallback
}

function roleLabel(role) {
  if (role === 'ADMIN') return 'Administrator'
  if (role === 'STUDENT') return 'Student'
  return role || 'Account'
}

export default function Profile() {
  const { updateUserProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [nameError, setNameError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const result = await getMyProfile()
      setProfile(result)
      setName(result.name || '')
      setPhoneNumber(result.phoneNumber || '')
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setLoadError(requestMessage(error, 'Your profile could not be loaded. Check your connection and try again.'))
    } finally {
      setLoading(false)
    }
  }, [logout, navigate])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  function cancelProfileEdit() {
    setName(profile?.name || '')
    setPhoneNumber(profile?.phoneNumber || '')
    setNameError('')
    setProfileError('')
    setEditing(false)
  }

  async function saveProfile(event) {
    event.preventDefault()
    setProfileMessage('')
    setProfileError('')
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Enter your full name.')
      return
    }
    if (trimmedName.length > 100) {
      setNameError('Name must be 100 characters or fewer.')
      return
    }
    const trimmedPhoneNumber = phoneNumber.trim()
    if (trimmedPhoneNumber && !/^(?=.*\d)[+]?[0-9() .-]{7,25}$/.test(trimmedPhoneNumber)) {
      setProfileError('Enter a valid phone number using 7 to 25 digits, spaces, or + ( ) . - characters.')
      return
    }
    setNameError('')
    setSavingProfile(true)
    try {
      const updated = await updateMyProfile({ name: trimmedName, phoneNumber: trimmedPhoneNumber })
      if ((updated.phoneNumber || '').trim() !== trimmedPhoneNumber) {
        setProfileError('The auth service did not return the saved phone number. Try again.')
        return
      }
      setProfile(updated)
      setName(updated.name)
      setPhoneNumber(updated.phoneNumber || '')
      updateUserProfile(updated)
      setEditing(false)
      setProfileMessage('Your profile has been updated.')
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setProfileError(requestMessage(error, 'Your profile could not be saved. Please try again.'))
    } finally {
      setSavingProfile(false)
    }
  }

  function updatePasswordField(event) {
    setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }))
    setPasswordError('')
    setPasswordMessage('')
  }

  async function savePassword(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    if (passwords.newPassword.length < 8 || passwords.newPassword.length > 72) {
      setPasswordError('Your new password must be between 8 and 72 characters.')
      return
    }
    if (new TextEncoder().encode(passwords.newPassword).length > 72) {
      setPasswordError('Your new password must be no more than 72 UTF-8 bytes.')
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('The new password and confirmation do not match.')
      return
    }
    setSavingPassword(true)
    try {
      await changeMyPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage('Your password has been changed.')
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setPasswordError(requestMessage(error, 'Your password could not be changed. Please try again.'))
    } finally {
      setSavingPassword(false)
    }
  }

  const inputClass = 'mt-2 block w-full rounded-sm border border-[#cbd3ca] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#247465] focus:ring-2 focus:ring-[#247465]/15 disabled:bg-[#f3f4ed] disabled:text-[#657570]'

  return (
    <main className="min-h-screen bg-[#f3f4ed] text-[#172d2a]">
      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b]">Account</p>
          <h1 className="mt-2 font-serif text-4xl">Your profile</h1>
          <p className="mt-2 text-sm text-[#657570]">Manage your personal information and account security.</p>
        </header>

        {loading && <p role="status" className="border border-[#d9ded5] bg-white px-5 py-6 text-sm text-[#657570]">Loading your profile...</p>}
        {!loading && loadError && (
          <div role="alert" className="border-l-4 border-[#bd4c37] bg-white p-5">
            <p className="text-sm">{loadError}</p>
            <button type="button" onClick={loadProfile} className="mt-4 rounded-sm bg-[#254d40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#18392f] focus:outline-none focus:ring-2 focus:ring-[#247465]">Try again</button>
          </div>
        )}

        {!loading && profile && (
          <div className="space-y-6">
            <section aria-labelledby="profile-overview-heading" className="border border-[#d9ded5] bg-white p-5 sm:p-7">
              <h2 id="profile-overview-heading" className="sr-only">Profile overview</h2>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div aria-label={`Default avatar for ${profile.name || 'your account'}`} role="img" className="flex size-20 shrink-0 items-center justify-center rounded-full border border-[#b8cdbf] bg-[#edf4ef] font-serif text-2xl font-semibold text-[#254d40]">
                  {initials(profile.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="break-words font-serif text-3xl">{profile.name}</h2>
                  <p className="mt-1 break-all text-sm text-[#657570]">{profile.email}</p>
                  <span className="mt-3 inline-flex rounded-full border border-[#b8cdbf] bg-[#edf4ef] px-3 py-1 text-xs font-semibold text-[#426e5c]">{roleLabel(profile.role)}</span>
                </div>
              </div>
            </section>

            <section aria-labelledby="personal-info-heading" className="border border-[#d9ded5] bg-white p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 id="personal-info-heading" className="font-serif text-2xl">Personal information</h2>
                  <p className="mt-1 text-sm text-[#657570]">Your account identity and contact details.</p>
                </div>
                {!editing && <button type="button" onClick={() => { setProfileError(''); setProfileMessage(''); setEditing(true) }} className="rounded-sm border border-[#bdc9bf] px-4 py-2 text-sm font-semibold hover:bg-[#edf4ef] focus:outline-none focus:ring-2 focus:ring-[#247465]">Edit profile</button>}
              </div>

              {profileMessage && <p role="status" className="mt-5 border-l-4 border-[#426e5c] bg-[#edf4ef] px-4 py-3 text-sm">{profileMessage}</p>}
              {profileError && <p role="alert" className="mt-5 border-l-4 border-[#bd4c37] bg-[#fbe9e3] px-4 py-3 text-sm text-[#7f2f22]">{profileError}</p>}

              {editing ? (
                <form onSubmit={saveProfile} className="mt-6 max-w-xl space-y-5">
                  <div>
                    <label htmlFor="profile-name" className="block text-sm font-semibold">Full name</label>
                    <input id="profile-name" name="name" type="text" autoComplete="name" required maxLength={100} value={name} onChange={(event) => { setName(event.target.value); setNameError('') }} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'profile-name-error' : undefined} className={inputClass} />
                    {nameError && <p id="profile-name-error" role="alert" className="mt-1 text-sm text-[#a14935]">{nameError}</p>}
                    <p className="mt-1 text-xs text-[#68817b]">Up to 100 characters.</p>
                  </div>
                  <div>
                    <label htmlFor="profile-phone-number" className="block text-sm font-semibold">Phone number</label>
                    <input id="profile-phone-number" name="phoneNumber" type="tel" autoComplete="tel" maxLength={25} value={phoneNumber} onChange={(event) => { setPhoneNumber(event.target.value); setProfileError('') }} aria-describedby="profile-phone-help" className={inputClass} />
                    <p id="profile-phone-help" className="mt-1 text-xs text-[#68817b]">Optional. Use 7–25 characters with digits and common phone formatting symbols.</p>
                  </div>
                  <div>
                    <label htmlFor="profile-email" className="block text-sm font-semibold">Email address</label>
                    <input id="profile-email" type="email" value={profile.email} readOnly className={inputClass} />
                    <p className="mt-1 text-xs text-[#68817b]">Email changes are not supported because it is tied to your sign-in identity.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button type="submit" disabled={savingProfile} className="rounded-sm bg-[#254d40] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#18392f] focus:outline-none focus:ring-2 focus:ring-[#247465] disabled:cursor-wait disabled:opacity-60">{savingProfile ? 'Saving...' : 'Save changes'}</button>
                    <button type="button" onClick={cancelProfileEdit} disabled={savingProfile} className="rounded-sm border border-[#bdc9bf] px-5 py-2.5 text-sm font-semibold hover:bg-[#edf4ef] focus:outline-none focus:ring-2 focus:ring-[#247465] disabled:opacity-60">Cancel</button>
                  </div>
                </form>
              ) : (
                <dl className="mt-6 grid gap-x-8 gap-y-5 border-t border-[#e2e7e1] pt-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#68817b]">Full name</dt>
                    <dd className="mt-1 break-words text-sm font-medium">{profile.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#68817b]">Email address</dt>
                    <dd className="mt-1 break-all text-sm font-medium">{profile.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#68817b]">Account role</dt>
                    <dd className="mt-1 text-sm font-medium">{roleLabel(profile.role)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#68817b]">Phone number</dt>
                    <dd className="mt-1 text-sm font-medium">{profile.phoneNumber?.trim() || 'Not provided'}</dd>
                  </div>
                </dl>
              )}
            </section>

            <section aria-labelledby="security-heading" className="border border-[#d9ded5] bg-white p-5 sm:p-7">
              <h2 id="security-heading" className="font-serif text-2xl">Account security</h2>
              {profile.googleAccount ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657570]">This account is connected to Google. Manage your password and sign-in security in your Google Account.</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-[#657570]">Change the password used to sign in to EduNova.</p>
                  {passwordMessage && <p role="status" className="mt-5 border-l-4 border-[#426e5c] bg-[#edf4ef] px-4 py-3 text-sm">{passwordMessage}</p>}
                  {passwordError && <p role="alert" className="mt-5 border-l-4 border-[#bd4c37] bg-[#fbe9e3] px-4 py-3 text-sm text-[#7f2f22]">{passwordError}</p>}
                  <form onSubmit={savePassword} className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="current-password" className="block text-sm font-semibold">Current password</label>
                      <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={updatePasswordField} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-semibold">New password</label>
                      <input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={passwords.newPassword} onChange={updatePasswordField} className={inputClass} />
                      <p className="mt-1 text-xs text-[#68817b]">Use 8–72 characters.</p>
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-semibold">Confirm new password</label>
                      <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required value={passwords.confirmPassword} onChange={updatePasswordField} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <button type="submit" disabled={savingPassword} className="rounded-sm bg-[#254d40] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#18392f] focus:outline-none focus:ring-2 focus:ring-[#247465] disabled:cursor-wait disabled:opacity-60">{savingPassword ? 'Updating...' : 'Update password'}</button>
                    </div>
                  </form>
                </>
              )}
            </section>

            <p className="px-1 text-xs leading-5 text-[#68817b]">Account creation date, account status, profile-picture storage, and notification preferences are not provided by the current backend.</p>
            <p className="px-1 text-sm"><Link to="/settings" className="font-semibold text-[#254d40] underline underline-offset-4 hover:text-[#426e5c]">Account preferences</Link> are not currently available.</p>
          </div>
        )}
      </section>
    </main>
  )
}
