import { useEffect, useRef, useState } from 'react'

const GOOGLE_SCRIPT_SELECTOR = 'script[data-edunova-google-identity]'

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || 'Google sign-in could not be completed. Please try again.'
}

export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const buttonRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  onCredentialRef.current = onCredential

  useEffect(() => {
    if (!clientId) return undefined

    let active = true
    const renderGoogleButton = () => {
      if (!active) return
      const identity = window.google?.accounts?.id
      if (!identity || !buttonRef.current) {
        setError('Google sign-in could not be initialized. Please refresh and try again.')
        return
      }

      identity.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            setError('Google did not return a sign-in credential. Please try again.')
            return
          }
          setError('')
          setProcessing(true)
          Promise.resolve(onCredentialRef.current(response.credential))
            .catch((requestError) => {
              if (active) setError(getErrorMessage(requestError))
            })
            .finally(() => {
              if (active) setProcessing(false)
            })
        },
      })
      identity.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
      })
    }

    const handleScriptError = () => {
      if (active) setError('Google sign-in could not load. Check your connection and try again.')
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton()
      return () => { active = false }
    }

    let script = document.querySelector(GOOGLE_SCRIPT_SELECTOR)
    const shouldAppendScript = !script
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.edunovaGoogleIdentity = 'true'
    }

    script.addEventListener('load', renderGoogleButton)
    script.addEventListener('error', handleScriptError)
    if (shouldAppendScript) document.head.appendChild(script)

    return () => {
      active = false
      script.removeEventListener('load', renderGoogleButton)
      script.removeEventListener('error', handleScriptError)
    }
  }, [clientId])

  return (
    <div>
      {!clientId ? (
        <p role="alert" className="text-center text-sm text-[#a14935]">
          Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in the frontend environment.
        </p>
      ) : (
        <>
          <div
            ref={buttonRef}
            aria-disabled={disabled || processing}
            className={`flex min-h-10 justify-center ${disabled || processing ? 'pointer-events-none opacity-60' : ''}`}
          />
          {processing && <p role="status" className="mt-3 text-center text-sm text-[#657570]">Signing in with Google...</p>}
          {error && <p role="alert" className="mt-3 text-center text-sm text-[#a14935]">{error}</p>}
        </>
      )}
    </div>
  )
}
