// @author  veera
// @file    hooks/useAppColorMode.ts
//
// Tracks <html data-theme="light|dark"> for MUI themes that follow app theme.

import { useEffect, useState } from 'react'

export function useAppColorMode(): 'light' | 'dark' {
  const [mode, setMode] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'dark'
      : 'light',
  )
  useEffect(() => {
    const el = document.documentElement
    const sync = () => setMode(el.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
    const obs = new MutationObserver(sync)
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return mode
}
