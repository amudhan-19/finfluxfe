// @author  veera
// @file    components/layout/TopBar.tsx
//
// Auth-aware top bar — enterprise Tick & Tie chrome (fixed dark header).

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, User } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { ROLE_LABELS } from '@/utils/rbac'
import { normalizeRole } from '@/config/rbac'
import ThemeToggle from '@/components/shared/ThemeToggle'
import NotificationBell from '@/components/layout/NotificationBell'
import logoLight from '@/assets/images/logo-light.svg'

function profilePathForRole(role: string): string | null {
  switch (normalizeRole(role)) {
    case 'analyst': return '/analyst/settings'
    case 'supervisor': return '/supervisor/flux-settings'
    case 'director': return '/director/queue'
    case 'admin':
    case 'super_admin': return '/admin/config'
    default: return null
  }
}

function roleBadgeLabel(role: string): string {
  const normalized = normalizeRole(role)
  if (normalized === 'super_admin') return 'Super Admin'
  if (normalized === 'admin') return 'Admin'
  return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role
}

export default function TopBar({ rightExtra }: { rightExtra?: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  if (!user) return null

  const normalizedRole = normalizeRole(user.role)
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin'
  const profilePath = profilePathForRole(user.role)

  return (
    <header className="app-topbar" style={{ position: 'relative' }}>
      <div className="app-topbar__inner">
        <a href="/" className="app-topbar__logo" aria-label="Tick and Tie home">
          <img src={logoLight} alt="Tick & Tie" />
        </a>

        <span className="app-topbar__divider" aria-hidden />

        {isAdmin && rightExtra == null ? (
          <span className="app-topbar__licence">
            <span className="app-topbar__licence-label">Licence</span>
            <span className="app-topbar__licence-value" aria-hidden>—</span>
          </span>
        ) : null}

        <span className="app-topbar__spacer" />

        {rightExtra != null ? (
          <div className="app-topbar__licence" style={{ display: 'flex' }}>
            {rightExtra}
          </div>
        ) : null}

        <div className="app-topbar__controls">
          <NotificationBell variant="header" />

          <ThemeToggle />

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="app-topbar__avatar-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Open profile menu"
            >
              <span className="app-topbar__avatar">
                {user.initials}
              </span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="app-profile-menu__backdrop"
                  role="presentation"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="app-profile-menu" role="menu" aria-label="Profile menu">
                  <div className="app-profile-menu__user">
                    <span className="app-profile-menu__avatar">
                      {user.initials}
                    </span>
                    <div className="app-profile-menu__info">
                      <div className="app-profile-menu__name">{user.name}</div>
                      <div className="app-profile-menu__email" title={user.email}>{user.email}</div>
                      <span className="app-profile-menu__role-badge">{roleBadgeLabel(user.role)}</span>
                    </div>
                  </div>

                  <hr className="app-profile-menu__divider" />

                  <div className="app-profile-menu__items">
                    <button
                      type="button"
                      role="menuitem"
                      className="app-profile-menu__item"
                      onClick={() => {
                        setMenuOpen(false)
                        if (profilePath) navigate(profilePath)
                      }}
                    >
                      <User size={18} strokeWidth={2} />
                      Profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="app-profile-menu__item"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/forgot-password')
                      }}
                    >
                      <KeyRound size={18} strokeWidth={2} />
                      Change Password
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="app-profile-menu__item app-profile-menu__item--danger"
                      onClick={() => {
                        setMenuOpen(false)
                        signOut()
                      }}
                    >
                      <LogOut size={18} strokeWidth={2} />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {rightExtra != null ? (
        <div className="app-topbar__mobile-extra">{rightExtra}</div>
      ) : null}
    </header>
  )
}
