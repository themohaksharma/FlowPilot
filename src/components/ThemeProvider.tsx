import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

type ThemeContextValue = { theme: Theme; toggleTheme: () => void }
const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'flowpilot-theme'

function getInitialTheme(): Theme {
  const current = document.documentElement.dataset.theme
  return current === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const transitionTimer = useRef<number | undefined>(undefined)

  const applyTheme = useCallback((next: Theme, persist: boolean) => {
    document.documentElement.classList.add('theme-transitioning')
    document.documentElement.dataset.theme = next
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0d110e' : '#f3f0e8')
    setTheme(next)
    if (persist) {
      try { window.localStorage.setItem(STORAGE_KEY, next) } catch { /* Storage can be unavailable in private browsing. */ }
    }
    window.clearTimeout(transitionTimer.current)
    transitionTimer.current = window.setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 380)
  }, [])

  const toggleTheme = useCallback(() => applyTheme(theme === 'light' ? 'dark' : 'light', true), [applyTheme, theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    let hasSavedChoice = false
    try { hasSavedChoice = window.localStorage.getItem(STORAGE_KEY) === 'light' || window.localStorage.getItem(STORAGE_KEY) === 'dark' } catch { /* Keep the bootstrapped theme. */ }
    if (hasSavedChoice) return () => window.clearTimeout(transitionTimer.current)

    const syncSystemTheme = (event: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY)) return
      } catch { /* Continue following the system when storage is unavailable. */ }
      applyTheme(event.matches ? 'dark' : 'light', false)
    }
    media.addEventListener('change', syncSystemTheme)
    return () => {
      media.removeEventListener('change', syncSystemTheme)
      window.clearTimeout(transitionTimer.current)
    }
  }, [applyTheme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used within ThemeProvider')
  return value
}
