// @author  veera
// @file    features/admin-support/components/AISupportFab.tsx

import { useEffect, useState } from 'react'
import { Headphones, X } from 'lucide-react'
import { AISupportChat } from '@/features/admin-support/components/AISupportChat'

export function AISupportFab() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {open ? (
        <>
          <button
            type="button"
            className="support-fab-overlay"
            aria-label="Close AI support"
            onClick={() => setOpen(false)}
          />
          <div
            className="support-fab-popup"
            role="dialog"
            aria-labelledby="ai-support-title"
            aria-modal="true"
          >
            <AISupportChat variant="popup" onClose={() => setOpen(false)} />
          </div>
        </>
      ) : null}

      <button
        type="button"
        className={`support-fab${open ? ' support-fab--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AI support' : 'Open AI support'}
        aria-expanded={open}
      >
        {open ? <X size={24} strokeWidth={2} /> : <Headphones size={24} strokeWidth={2} />}
      </button>
    </>
  )
}
