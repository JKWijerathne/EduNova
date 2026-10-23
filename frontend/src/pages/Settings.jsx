import { useTheme } from '../context/useTheme.js'

const themes = [
  {
    value: 'light',
    icon: '☀️',
    title: 'Light Mode',
    description: 'Use the light appearance throughout EduNova.',
  },
  {
    value: 'dark',
    icon: '🌙',
    title: 'Dark Mode',
    description: 'Use a darker appearance that is easier on the eyes.',
  },
  {
    value: 'system',
    icon: '💻',
    title: 'System Default',
    description: 'Match the appearance set on your device.',
  },
]

export default function Settings() {
  const { theme, setTheme } = useTheme()

  return (
    <main className="min-h-screen bg-[#f3f4ed] px-6 py-10 text-[#172d2a] dark:bg-gray-950 dark:text-gray-100 sm:px-10">
      <section className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#68817b] dark:text-gray-400">Preferences</p>
        <h1 className="mt-3 font-serif text-4xl">Settings</h1>
        <section aria-labelledby="theme-heading" className="mt-8 rounded-xl border border-[#d9ded5] bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-8">
          <div>
            <h2 id="theme-heading" className="text-xl font-semibold">Theme &amp; Appearance</h2>
            <p className="mt-2 text-sm text-[#657570] dark:text-gray-400">
              Choose how EduNova looks on this device. Your preference is saved automatically.
            </p>
          </div>
          <fieldset className="mt-6 space-y-3">
            <legend className="sr-only">Choose a theme</legend>
            {themes.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                  theme === option.value
                    ? 'border-[#426e5c] bg-[#edf4ef] dark:border-emerald-700 dark:bg-gray-800'
                    : 'border-[#d9ded5] hover:bg-[#f6f8f3] dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={theme === option.value}
                  onChange={() => setTheme(option.value)}
                  className="mt-1 size-4 accent-[#23675b]"
                />
                <span aria-hidden="true" className="text-xl">{option.icon}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">{option.title}</span>
                  <span className="mt-1 block text-sm text-[#657570] dark:text-gray-400">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </section>
      </section>
    </main>
  )
}
