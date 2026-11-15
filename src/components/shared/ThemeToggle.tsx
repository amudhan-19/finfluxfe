// @author  veera
// @file    components/shared/ThemeToggle.tsx

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'

export default function ThemeToggle() {
  const { mode, toggle } = useTheme()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      className="app-topbar__icon-btn"
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={16} strokeWidth={2} style={{ color: '#fde68a' }} />
      ) : (
        <Moon size={16} strokeWidth={2} />
      )}
    </button>
  )
}
