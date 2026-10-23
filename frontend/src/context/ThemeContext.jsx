import { useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './themeContext.js'

const themeOptions = ['light', 'dark', 'system']
const storageKey = 'edunova-theme'

function getSavedTheme() {
  const savedTheme = window.localStorage.getItem(storageKey)
  return themeOptions.includes(savedTheme) ? savedTheme : 'system'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getSavedTheme)
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemPreference = (event) => setSystemPrefersDark(event.matches)

    mediaQuery.addEventListener('change', updateSystemPreference)
    return () => mediaQuery.removeEventListener('change', updateSystemPreference)
  }, [])

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark)
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [theme, systemPrefersDark])

  useEffect(() => {
    function syncTheme(event) {
      if (event.key === storageKey) {
        setTheme(themeOptions.includes(event.newValue) ? event.newValue : 'system')
      }
    }

    window.addEventListener('storage', syncTheme)
    return () => window.removeEventListener('storage', syncTheme)
  }, [])

  function updateTheme(nextTheme) {
    if (!themeOptions.includes(nextTheme)) {
      throw new Error(`Unsupported theme: ${nextTheme}`)
    }
    window.localStorage.setItem(storageKey, nextTheme)
    setTheme(nextTheme)
  }

  const value = useMemo(() => ({ theme, setTheme: updateTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
