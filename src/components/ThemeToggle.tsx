import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'light' ? 'dark' : 'light'
  const Icon = theme === 'light' ? Moon : Sun
  return <button
    type="button"
    className={`theme-toggle${compact ? ' theme-toggle-compact' : ''}`}
    onClick={toggleTheme}
    aria-label={`Switch to ${next} theme`}
    aria-pressed={theme === 'dark'}
    title={`Switch to ${next} theme`}
  >
    <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
    {!compact && <span>{theme === 'light' ? 'Dark' : 'Light'} mode</span>}
  </button>
}
